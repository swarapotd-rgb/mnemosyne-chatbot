import mockResponses from './mockResponses';

interface GeminiMessage {
  parts: Array<{
    text: string;
  }>;
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
    finishReason: string;
  }>;
}

interface PatientContext {
  chronicConditions: string[];
  medications: string[];
  medicalHistory: string[];
  age?: number;
  gender?: string;
}

interface SymptomAnalysis {
  primarySymptom: string;
  severity: number;
  duration: string;
  associatedSymptoms: string[];
  triggers: string[];
  confidence: number;
  urgencyLevel: 'low' | 'medium' | 'high' | 'emergency';
  preliminaryDiagnosis?: string;
}

class AIService {
  private apiKey: string;
  private model: string;
  private baseUrl: string = 'https://generativelanguage.googleapis.com/v1beta/models';
  private useMockResponses = false; // Set to false to use Gemini API

  constructor(apiKey?: string) {
    this.apiKey = apiKey || '';
    this.model = 'gemini-pro';
  }

  private formatMockResponse(analysis: any): string {
    return `Based on your symptoms, here's my analysis:

Assessment: ${analysis.assessment}

Urgency Level: ${analysis.urgencyLevel.toUpperCase()}

Possible Conditions:
${analysis.possibleConditions.map((condition: string) => `• ${condition}`).join('\n')}

Recommendations:
${analysis.recommendations.map((rec: string) => `• ${rec}`).join('\n')}

Next Steps:
${analysis.nextSteps.map((step: string) => `• ${step}`).join('\n')}

Would you like me to:
1. Find healthcare providers in your area
2. Explain any of these recommendations in more detail
3. Provide self-care tips
4. Ask additional questions about your symptoms

Please let me know how I can help further.`;
  }

  private async generateGeminiResponse(messages: string[]): Promise<string> {
    const url = `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: messages.map(msg => ({ text: msg }))
            }
          ],
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Gemini API Error Response:', error);
        throw new Error(`Gemini API error: ${error.error?.message || 'Unknown error'}`);
      }

      const data: GeminiResponse = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response generated from Gemini API');
      }

      const candidate = data.candidates[0];
      if (candidate.finishReason === 'SAFETY') {
        throw new Error('Response blocked by safety filters');
      }

      return candidate.content?.parts[0]?.text || 'I apologize, but I could not generate a response.';
    } catch (error: any) {
      console.error('Gemini API Error:', error);
      throw error;
    }
  }

  async generateResponse(
    userInput: string,
    conversationHistory: Array<{botMessage: string, userResponse?: string}>,
    patientContext: PatientContext,
    symptomAnalysis: SymptomAnalysis | null
  ): Promise<string> {
    if (this.useMockResponses || !this.apiKey) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      
      // Check for greetings or initial messages
      if (conversationHistory.length === 0) {
        return mockResponses.conversations.greeting;
      }

      // Generate a contextual response based on user input
      const input = userInput.toLowerCase();
      if (input.includes('fever') || input.includes('temperature')) {
        return this.formatMockResponse(mockResponses.symptomAnalysis.fever);
      } else if (input.includes('headache') || input.includes('head pain')) {
        return this.formatMockResponse(mockResponses.symptomAnalysis.headache);
      } else {
        return this.formatMockResponse(mockResponses.symptomAnalysis.default);
      }
    }

    try {
      const systemPrompt = this.buildSystemPrompt(patientContext, symptomAnalysis);
      const conversation = this.buildConversationHistory(conversationHistory);
      const messages = [systemPrompt, ...conversation, userInput];
      
      return await this.generateGeminiResponse(messages);
    } catch (error: any) {
      console.error('AI Service Error:', error);
      return `I apologize, but I'm experiencing technical difficulties. ${error.message}`;
    }
  }

  private buildSystemPrompt(patientContext: PatientContext, symptomAnalysis: SymptomAnalysis | null): string {
    let prompt = `You are Mnemosyne, an AI Health Companion designed to help users explore their symptoms and guide them to appropriate care. 

IMPORTANT MEDICAL DISCLAIMERS:
- You are NOT a licensed medical professional
- You do NOT provide medical diagnoses
- You do NOT replace professional medical advice
- Always recommend consulting healthcare providers for serious symptoms
- If symptoms suggest emergency conditions, strongly recommend immediate medical attention

YOUR ROLE:
- Provide empathetic, supportive guidance
- Ask clarifying questions to better understand symptoms
- Offer general health information and self-care suggestions
- Guide users toward appropriate healthcare resources
- Maintain a professional, caring tone

PATIENT CONTEXT:`;

    if (patientContext.chronicConditions.length > 0) {
      prompt += `\n- Chronic conditions: ${patientContext.chronicConditions.join(', ')}`;
    }
    if (patientContext.medications.length > 0) {
      prompt += `\n- Current medications: ${patientContext.medications.join(', ')}`;
    }
    if (patientContext.age) {
      prompt += `\n- Age: ${patientContext.age}`;
    }
    if (patientContext.gender) {
      prompt += `\n- Gender: ${patientContext.gender}`;
    }

    if (symptomAnalysis) {
      prompt += `\n\nCURRENT SYMPTOM ANALYSIS:
- Primary symptom: ${symptomAnalysis.primarySymptom}
- Duration: ${symptomAnalysis.duration}
- Severity (1-10): ${symptomAnalysis.severity}
- Associated symptoms: ${symptomAnalysis.associatedSymptoms.join(', ') || 'None reported'}
- Triggers: ${symptomAnalysis.triggers.join(', ') || 'None reported'}
- Urgency level: ${symptomAnalysis.urgencyLevel}
- Confidence: ${symptomAnalysis.confidence}%`;

      if (symptomAnalysis.preliminaryDiagnosis) {
        prompt += `\n- Preliminary assessment: ${symptomAnalysis.preliminaryDiagnosis}`;
      }
    }

    return prompt;
  }

  private buildConversationHistory(conversationHistory: Array<{botMessage: string, userResponse?: string}>): string[] {
    const messages: string[] = [];
    conversationHistory.forEach(step => {
      messages.push(`Assistant: ${step.botMessage}`);
      if (step.userResponse) {
        messages.push(`User: ${step.userResponse}`);
      }
    });
    return messages;
  }

  async generateFollowUpQuestions(
    currentSymptoms: string,
    patientContext: PatientContext,
    conversationHistory: Array<{botMessage: string, userResponse?: string}>
  ): Promise<string[]> {
    if (this.useMockResponses || !this.apiKey) {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      return mockResponses.conversations.followUp;
    }

    try {
      const prompt = `Generate 3 relevant follow-up questions to better understand the patient's symptoms. Questions should be clear, specific, and help gather important clinical information.

Current symptoms: ${currentSymptoms}
Patient context: ${JSON.stringify(patientContext)}

Return only the questions, one per line.`;

      const response = await this.generateGeminiResponse([prompt]);
      return response.split('\n').filter(q => q.trim().length > 0);
    } catch (error) {
      console.error('Error generating follow-up questions:', error);
      return [
        'Can you describe the severity of your symptoms on a scale of 1-10?',
        'Have you noticed any triggers or patterns with these symptoms?',
        'How are these symptoms affecting your daily activities?'
      ];
    }
  }

  async analyzeSymptoms(
    symptomDescription: string,
    patientContext: PatientContext,
    additionalInfo?: string
  ): Promise<{
    assessment: string;
    urgencyLevel: 'low' | 'medium' | 'high' | 'emergency';
    possibleConditions: string[];
    possiblePrecautions: string[];
    specialistToConsider: string[];
    error?: string;
  }> {
    if (this.useMockResponses || !this.apiKey) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      
      const symptoms = symptomDescription.toLowerCase();
      
      // Enhanced symptom detection with more specific conditions
      if (symptoms.includes('fever') || symptoms.includes('temperature') || symptoms.includes('hot')) {
        return {
          assessment: mockResponses.symptomAnalysis.fever.assessment,
          urgencyLevel: mockResponses.symptomAnalysis.fever.urgencyLevel,
          possibleConditions: mockResponses.symptomAnalysis.fever.possibleConditions,
          possiblePrecautions: mockResponses.symptomAnalysis.fever.recommendations,
          specialistToConsider: ['General Practitioner', 'Internal Medicine', 'Infectious Disease Specialist']
        };
      } else if (symptoms.includes('headache') || symptoms.includes('head pain') || symptoms.includes('migraine')) {
        return {
          assessment: mockResponses.symptomAnalysis.headache.assessment,
          urgencyLevel: mockResponses.symptomAnalysis.headache.urgencyLevel,
          possibleConditions: mockResponses.symptomAnalysis.headache.possibleConditions,
          possiblePrecautions: mockResponses.symptomAnalysis.headache.recommendations,
          specialistToConsider: ['General Practitioner', 'Neurologist', 'Headache Specialist']
        };
      } else if (symptoms.includes('chest pain') || symptoms.includes('chest discomfort') || symptoms.includes('heart pain')) {
        return {
          assessment: mockResponses.symptomAnalysis.chestPain.assessment,
          urgencyLevel: mockResponses.symptomAnalysis.chestPain.urgencyLevel,
          possibleConditions: mockResponses.symptomAnalysis.chestPain.possibleConditions,
          possiblePrecautions: mockResponses.symptomAnalysis.chestPain.recommendations,
          specialistToConsider: ['Emergency Medicine', 'Cardiologist', 'General Practitioner']
        };
      } else if (symptoms.includes('shortness of breath') || symptoms.includes('difficulty breathing') || symptoms.includes('breathing problem')) {
        return {
          assessment: mockResponses.symptomAnalysis.shortnessOfBreath.assessment,
          urgencyLevel: mockResponses.symptomAnalysis.shortnessOfBreath.urgencyLevel,
          possibleConditions: mockResponses.symptomAnalysis.shortnessOfBreath.possibleConditions,
          possiblePrecautions: mockResponses.symptomAnalysis.shortnessOfBreath.recommendations,
          specialistToConsider: ['Pulmonologist', 'Emergency Medicine', 'General Practitioner']
        };
      } else if (symptoms.includes('stomach pain') || symptoms.includes('abdominal pain') || symptoms.includes('belly pain') || symptoms.includes('nausea')) {
        return {
          assessment: mockResponses.symptomAnalysis.abdominalPain.assessment,
          urgencyLevel: mockResponses.symptomAnalysis.abdominalPain.urgencyLevel,
          possibleConditions: mockResponses.symptomAnalysis.abdominalPain.possibleConditions,
          possiblePrecautions: mockResponses.symptomAnalysis.abdominalPain.recommendations,
          specialistToConsider: ['Gastroenterologist', 'General Practitioner', 'Emergency Medicine']
        };
      } else if (symptoms.includes('dizziness') || symptoms.includes('vertigo') || symptoms.includes('lightheaded')) {
        return {
          assessment: "Dizziness can have various causes ranging from inner ear problems to cardiovascular issues.",
          urgencyLevel: "medium" as const,
          possibleConditions: [
            "Benign paroxysmal positional vertigo (BPPV)",
            "Vestibular neuritis",
            "Low blood pressure",
            "Anxiety or panic disorder",
            "Dehydration",
            "Medication side effects"
          ],
          possiblePrecautions: [
            "Sit or lie down when dizzy",
            "Stay hydrated",
            "Avoid sudden head movements",
            "Get up slowly from sitting/lying",
            "Avoid driving or operating machinery"
          ],
          specialistToConsider: ['Neurologist', 'ENT Specialist', 'General Practitioner', 'Cardiologist']
        };
      } else if (symptoms.includes('fatigue') || symptoms.includes('tired') || symptoms.includes('exhausted') || symptoms.includes('weakness')) {
        return {
          assessment: "Fatigue can be caused by various factors including lifestyle, medical conditions, or mental health issues.",
          urgencyLevel: "low" as const,
          possibleConditions: [
            "Sleep disorders",
            "Anemia",
            "Thyroid problems",
            "Depression or anxiety",
            "Chronic fatigue syndrome",
            "Diabetes",
            "Vitamin deficiencies"
          ],
          possiblePrecautions: [
            "Maintain regular sleep schedule",
            "Eat balanced meals",
            "Stay hydrated",
            "Exercise regularly",
            "Manage stress",
            "Avoid excessive caffeine"
          ],
          specialistToConsider: ['General Practitioner', 'Endocrinologist', 'Sleep Medicine Specialist', 'Psychiatrist']
        };
      } else if (symptoms.includes('cough') || symptoms.includes('coughing') || symptoms.includes('persistent cough')) {
        return {
          assessment: "A persistent cough can indicate various respiratory or other conditions.",
          urgencyLevel: "medium" as const,
          possibleConditions: [
            "Upper respiratory infection",
            "Bronchitis",
            "Asthma",
            "Post-nasal drip",
            "GERD (acid reflux)",
            "Pneumonia",
            "Allergies"
          ],
          possiblePrecautions: [
            "Stay hydrated",
            "Use humidifier",
            "Avoid irritants (smoke, dust)",
            "Elevate head while sleeping",
            "Gargle with salt water",
            "Avoid lying down after eating"
          ],
          specialistToConsider: ['Pulmonologist', 'General Practitioner', 'ENT Specialist', 'Allergist']
        };
      } else {
        return {
          assessment: mockResponses.symptomAnalysis.default.assessment,
          urgencyLevel: mockResponses.symptomAnalysis.default.urgencyLevel,
          possibleConditions: mockResponses.symptomAnalysis.default.possibleConditions,
          possiblePrecautions: mockResponses.symptomAnalysis.default.recommendations,
          specialistToConsider: ['General Practitioner', 'Internal Medicine']
        };
      }
    }

    try {
      const prompt = `You are a medical AI assistant. Analyze the following symptoms and provide a structured assessment. Be conservative and always recommend professional medical consultation.

Symptoms: ${symptomDescription}
Additional Info: ${additionalInfo || 'None provided'}
Patient Context: ${JSON.stringify(patientContext)}

Provide your response in this EXACT format:
ASSESSMENT: [Brief assessment of the symptoms]
URGENCY: [low/medium/high/emergency]
POSSIBLE_CONDITIONS:
- [Condition 1]
- [Condition 2]
- [Condition 3]
POSSIBLE_PRECAUTIONS:
- [Precaution 1]
- [Precaution 2]
- [Precaution 3]
SPECIALIST_TO_CONSIDER:
- [Specialist 1]
- [Specialist 2]
- [Specialist 3]

Important: Be specific and varied in your responses. Don't repeat the same generic advice. Consider the specific symptoms mentioned and provide relevant, actionable information.`;

      const response = await this.generateGeminiResponse([prompt]);
      const lines = response.split('\n');

      // Parse the structured response
      const assessment = lines.find(line => line.startsWith('ASSESSMENT:'))?.replace('ASSESSMENT:', '').trim() || 'Assessment pending';
      const urgencyMatch = lines.find(line => line.startsWith('URGENCY:'))?.replace('URGENCY:', '').trim().toLowerCase();
      const urgencyLevel = ['low', 'medium', 'high', 'emergency'].includes(urgencyMatch || '') 
        ? (urgencyMatch as 'low' | 'medium' | 'high' | 'emergency') 
        : 'medium';
      
      // Extract possible conditions
      const possibleConditionsStart = lines.findIndex(line => line.startsWith('POSSIBLE_CONDITIONS:'));
      const precautionsStart = lines.findIndex(line => line.startsWith('POSSIBLE_PRECAUTIONS:'));
      const specialistStart = lines.findIndex(line => line.startsWith('SPECIALIST_TO_CONSIDER:'));
      
      const possibleConditions = lines
        .slice(possibleConditionsStart + 1, precautionsStart > 0 ? precautionsStart : lines.length)
        .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
        .map(line => line.replace(/^[-•]\s*/, '').trim())
        .filter(condition => condition.length > 0);

      const possiblePrecautions = lines
        .slice(precautionsStart + 1, specialistStart > 0 ? specialistStart : lines.length)
        .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
        .map(line => line.replace(/^[-•]\s*/, '').trim())
        .filter(precaution => precaution.length > 0);

      const specialistToConsider = lines
        .slice(specialistStart + 1)
        .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
        .map(line => line.replace(/^[-•]\s*/, '').trim())
        .filter(specialist => specialist.length > 0);

      return {
        assessment,
        urgencyLevel,
        possibleConditions: possibleConditions.length > 0 ? possibleConditions : ['General health concern requiring evaluation'],
        possiblePrecautions: possiblePrecautions.length > 0 ? possiblePrecautions : ['Monitor symptoms closely', 'Consult with a healthcare provider'],
        specialistToConsider: specialistToConsider.length > 0 ? specialistToConsider : ['General Practitioner']
      };
    } catch (error: any) {
      console.error('Error analyzing symptoms:', error);
      return {
        assessment: 'Unable to analyze symptoms at this time',
        urgencyLevel: 'medium',
        possibleConditions: ['General health concern requiring evaluation'],
        possiblePrecautions: ['Please consult with a healthcare provider'],
        specialistToConsider: ['General Practitioner'],
        error: error.message
      };
    }
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  setUseMockResponses(useMock: boolean) {
    this.useMockResponses = useMock;
  }
}

// Export singleton instance
export const aiService = new AIService();

// Export class for testing
export { AIService };
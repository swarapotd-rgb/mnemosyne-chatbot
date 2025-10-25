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
  private useMockResponses = true; // Set to true for development without API

  constructor(apiKey?: string) {
    this.apiKey = apiKey || import.meta.env.VITE_GEMINI_API_KEY || '';
    this.model = 'gemini-pro';
  }

  private formatMockResponse(analysis: any): string {
    return `Based on your symptoms, here's my analysis:

Assessment: ${analysis.assessment}

Confidence Level: ${analysis.confidence}%
Urgency Level: ${analysis.urgencyLevel.toUpperCase()}

Recommendations:
${analysis.recommendations.map((rec: string) => `• ${rec}`).join('\n')}

Would you like me to:
1. Explain any of these recommendations in more detail
2. Find healthcare providers in your area
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
            temperature: 0.7,
            topK: 40,
            topP: 1,
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
        throw new Error(`Gemini API error: ${error.error?.message || 'Unknown error'}`);
      }

      const data: GeminiResponse = await response.json();
      return data.candidates[0]?.content?.parts[0]?.text || 'I apologize, but I could not generate a response.';
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
    confidence: number;
    urgencyLevel: 'low' | 'medium' | 'high' | 'emergency';
    recommendations: string[];
    error?: string;
  }> {
    if (this.useMockResponses || !this.apiKey) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      
      const symptoms = symptomDescription.toLowerCase();
      if (symptoms.includes('fever')) {
        return mockResponses.symptomAnalysis.fever;
      } else if (symptoms.includes('headache')) {
        return mockResponses.symptomAnalysis.headache;
      } else {
        return mockResponses.symptomAnalysis.default;
      }
    }

    try {
      const prompt = `Analyze the following symptoms and provide a structured assessment. Consider patient context and medical history. Be conservative in assessment and always recommend professional medical consultation for concerning symptoms.

Symptoms: ${symptomDescription}
Additional Info: ${additionalInfo || 'None provided'}
Patient Context: ${JSON.stringify(patientContext)}

Required response format:
ASSESSMENT: [Clear description of analysis]
CONFIDENCE: [Percentage 0-100]
URGENCY: [low/medium/high/emergency]
RECOMMENDATIONS:
- [First recommendation]
- [Additional recommendations]`;

      const response = await this.generateGeminiResponse([prompt]);
      const lines = response.split('\n');

      // Parse the structured response
      const assessment = lines.find(line => line.startsWith('ASSESSMENT:'))?.replace('ASSESSMENT:', '').trim() || 'Assessment pending';
      const confidenceMatch = lines.find(line => line.startsWith('CONFIDENCE:'))?.match(/\d+/);
      const confidence = confidenceMatch ? parseInt(confidenceMatch[0]) : 50;
      const urgencyMatch = lines.find(line => line.startsWith('URGENCY:'))?.replace('URGENCY:', '').trim().toLowerCase();
      const urgencyLevel = ['low', 'medium', 'high', 'emergency'].includes(urgencyMatch || '') 
        ? (urgencyMatch as 'low' | 'medium' | 'high' | 'emergency') 
        : 'medium';
      const recommendations = lines
        .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
        .map(line => line.replace(/^[-•]\s*/, '').trim());

      return {
        assessment,
        confidence,
        urgencyLevel,
        recommendations: recommendations.length > 0 ? recommendations : ['Consult with a healthcare provider']
      };
    } catch (error: any) {
      console.error('Error analyzing symptoms:', error);
      return {
        assessment: 'Unable to analyze symptoms at this time',
        confidence: 0,
        urgencyLevel: 'medium',
        recommendations: ['Please consult with a healthcare provider'],
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
// GPT-4 Service for Mnemosyne Chatbot
// This service handles communication with OpenAI's GPT-4 API

interface GPT4Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GPT4Response {
  choices: Array<{
    message: {
      content: string;
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

class GPT4Service {
  private apiKey: string;
  private baseUrl: string = 'https://api.openai.com/v1/chat/completions';

  constructor(apiKey?: string) {
    // In production, this should come from environment variables
    this.apiKey = apiKey || import.meta.env.VITE_OPENAI_API_KEY || '';
  }

  // Set API key dynamically
  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  // Generate intelligent response based on conversation context
  async generateResponse(
    userInput: string,
    conversationHistory: Array<{botMessage: string, userResponse?: string}>,
    patientContext: PatientContext,
    symptomAnalysis: SymptomAnalysis | null
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not provided. Please add your API key in the settings.');
    }

    const systemPrompt = this.buildSystemPrompt(patientContext, symptomAnalysis);
    const messages: GPT4Message[] = [
      { role: 'system', content: systemPrompt },
      ...this.buildConversationMessages(conversationHistory),
      { role: 'user', content: userInput }
    ];

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: messages,
          max_tokens: 500,
          temperature: 0.7,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data: GPT4Response = await response.json();
      return data.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';
    } catch (error) {
      console.error('GPT-4 API Error:', error);
      throw error;
    }
  }

  // Build system prompt with medical context
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

    prompt += `\n\nRESPONSE GUIDELINES:
- Keep responses concise but comprehensive
- Use medical terminology appropriately but explain complex terms
- Show empathy and understanding
- Ask follow-up questions when needed
- Always end with appropriate next steps or recommendations
- If uncertain, express uncertainty and recommend professional consultation`;

    return prompt;
  }

  // Convert conversation history to GPT-4 message format
  private buildConversationMessages(conversationHistory: Array<{botMessage: string, userResponse?: string}>): GPT4Message[] {
    const messages: GPT4Message[] = [];
    
    conversationHistory.forEach(step => {
      messages.push({ role: 'assistant', content: step.botMessage });
      if (step.userResponse) {
        messages.push({ role: 'user', content: step.userResponse });
      }
    });

    return messages;
  }

  // Generate follow-up questions based on current context
  async generateFollowUpQuestions(
    currentSymptoms: string,
    patientContext: PatientContext,
    conversationHistory: Array<{botMessage: string, userResponse?: string}>
  ): Promise<string[]> {
    const prompt = `Based on the current symptoms "${currentSymptoms}" and patient context, generate 2-3 relevant follow-up questions to better understand the situation. 

Patient context: ${JSON.stringify(patientContext)}

Return only the questions, one per line, without numbering or bullet points.`;

    try {
      const response = await this.generateResponse(prompt, conversationHistory, patientContext, null);
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

  // Analyze symptoms and provide preliminary assessment
  async analyzeSymptoms(
    symptomDescription: string,
    patientContext: PatientContext,
    additionalInfo?: string
  ): Promise<{
    assessment: string;
    confidence: number;
    urgencyLevel: 'low' | 'medium' | 'high' | 'emergency';
    recommendations: string[];
  }> {
    const prompt = `Analyze these symptoms: "${symptomDescription}"
    
Additional information: ${additionalInfo || 'None provided'}

Patient context: ${JSON.stringify(patientContext)}

Provide a preliminary assessment in this format:
ASSESSMENT: [Your assessment]
CONFIDENCE: [Percentage 0-100]
URGENCY: [low/medium/high/emergency]
RECOMMENDATIONS: [List of recommendations, one per line]`;

    try {
      const response = await this.generateResponse(prompt, [], patientContext, null);
      
      // Parse the structured response
      const lines = response.split('\n');
      const assessment = lines.find(line => line.startsWith('ASSESSMENT:'))?.replace('ASSESSMENT:', '').trim() || 'Assessment pending';
      const confidenceMatch = lines.find(line => line.startsWith('CONFIDENCE:'))?.match(/\d+/);
      const confidence = confidenceMatch ? parseInt(confidenceMatch[0]) : 50;
      const urgencyMatch = lines.find(line => line.startsWith('URGENCY:'))?.replace('URGENCY:', '').trim();
      const urgencyLevel = ['low', 'medium', 'high', 'emergency'].includes(urgencyMatch || '') 
        ? (urgencyMatch as 'low' | 'medium' | 'high' | 'emergency') 
        : 'medium';
      const recommendations = lines
        .filter(line => line.startsWith('-') || line.startsWith('•'))
        .map(line => line.replace(/^[-•]\s*/, '').trim())
        .filter(rec => rec.length > 0);

      return {
        assessment,
        confidence,
        urgencyLevel,
        recommendations: recommendations.length > 0 ? recommendations : ['Consult with a healthcare provider']
      };
    } catch (error) {
      console.error('Error analyzing symptoms:', error);
      return {
        assessment: 'Unable to analyze symptoms at this time',
        confidence: 0,
        urgencyLevel: 'medium',
        recommendations: ['Please consult with a healthcare provider']
      };
    }
  }
}

// Export singleton instance
export const gpt4Service = new GPT4Service();

// Export class for testing
export { GPT4Service };

// src/services/gpt4Service.ts
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
  private baseUrl = 'https://api.openai.com/v1/chat/completions';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || import.meta.env.VITE_OPENAI_API_KEY || '';
  }

  setApiKey(key: string) { this.apiKey = key; }

  private parseAnalysis(text: string) {
    const lines = text.split('\n');
    const assessment = lines.find(l => l.startsWith('ASSESSMENT:'))?.replace('ASSESSMENT:', '').trim() ?? '…';
    const urgencyRaw = lines.find(l => l.startsWith('URGENCY:'))?.replace('URGENCY:', '').trim().toLowerCase();
    const urgencyLevel = ['low', 'medium', 'high', 'emergency'].includes(urgencyRaw as any) ? (urgencyRaw as any) : 'medium';
    const recs = lines.filter(l => l.trim().startsWith('-') || l.trim().startsWith('•')).map(l => l.replace(/^[-•]\s*/, '').trim());
    return { assessment, urgencyLevel, recommendations: recs.length ? recs : ['Consult a healthcare provider'] };
  }

  private async buildSelfContainedAnswers(analysis: { assessment: string; recommendations: string[] }): Promise<string> {
    const prompt = `You are Mnemosyne, an AI Health Companion.

The user just received this symptom analysis:

Assessment: ${analysis.assessment}
Recommendations:
${analysis.recommendations.map(r => `- ${r}`).join('\n')}

Answer **each** of the four sections below in **clear, concise paragraphs** (max 2-3 sentences each).  
Use **bold headings** (1., 2., 3., 4.) and for section 4 generate **3 common follow-up questions** with **immediate answers** in **Q:/A:** format.

1. Explain any of the recommendations in more detail.
2. How can the user find healthcare providers in their area?
3. Provide additional self-care tips for the reported symptoms.
4. Generate 3 common follow-up questions the user might have and answer them.

Return **only** the four numbered sections, nothing else.`;

    const res = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!res.ok) throw new Error('GPT-4 API error');
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() ?? '';
  }

  async generateResponse(
    userInput: string,
    conversationHistory: Array<{ botMessage: string; userResponse?: string }>,
    patientContext: PatientContext,
    symptomAnalysis: SymptomAnalysis | null
  ): Promise<string> {
    if (!this.apiKey) throw new Error('OpenAI API key missing');

    const system = `You are Mnemosyne, an AI Health Companion...`; // (same system prompt as Gemini)
    const messages = [{ role: 'system', content: system } as any];
    conversationHistory.forEach(s => {
      messages.push({ role: 'assistant', content: s.botMessage });
      if (s.userResponse) messages.push({ role: 'user', content: s.userResponse });
    });
    messages.push({ role: 'user', content: userInput });

    const res = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages,
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!res.ok) throw new Error('GPT-4 API error');
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content ?? '';

    const parsed = this.parseAnalysis(raw);
    const summary = `Based on your symptoms, here's my analysis:

Assessment: ${parsed.assessment}

Urgency Level: ${parsed.urgencyLevel.toUpperCase()}

Recommendations:
${parsed.recommendations.map(r => `• ${r}`).join('\n')}`;

    const details = await this.buildSelfContainedAnswers(parsed);
    return `${summary}\n\n${details}`;
  }

  async analyzeSymptoms(
    symptomDescription: string,
    patientContext: PatientContext,
    additionalInfo?: string
  ): Promise<{
    assessment: string;
    urgencyLevel: 'low' | 'medium' | 'high' | 'emergency';
    possibleConditions: string[];
    recommendations: string[];
    nextSteps: string[];
  }> {
    const prompt = `Analyze these symptoms: "${symptomDescription}"
    
Additional information: ${additionalInfo || 'None provided'}

Patient context: ${JSON.stringify(patientContext)}

Provide a preliminary assessment in this format:
ASSESSMENT: [Your assessment]
URGENCY: [low/medium/high/emergency]
POSSIBLE_CONDITIONS:
- [Condition 1]
- [Condition 2]
- [Condition 3]
RECOMMENDATIONS:
- [Recommendation 1]
- [Recommendation 2]
- [Recommendation 3]
NEXT_STEPS:
- [Next step 1]
- [Next step 2]
- [Next step 3]`;

    try {
      const response = await this.generateResponse(prompt, [], patientContext, null);
      
      // Parse the structured response
      const lines = response.split('\n');
      const assessment = lines.find(line => line.startsWith('ASSESSMENT:'))?.replace('ASSESSMENT:', '').trim() || 'Assessment pending';
      const urgencyMatch = lines.find(line => line.startsWith('URGENCY:'))?.replace('URGENCY:', '').trim();
      const urgencyLevel = ['low', 'medium', 'high', 'emergency'].includes(urgencyMatch || '') 
        ? (urgencyMatch as 'low' | 'medium' | 'high' | 'emergency') 
        : 'medium';
      
      // Extract possible conditions
      const possibleConditionsStart = lines.findIndex(line => line.startsWith('POSSIBLE_CONDITIONS:'));
      const recommendationsStart = lines.findIndex(line => line.startsWith('RECOMMENDATIONS:'));
      const nextStepsStart = lines.findIndex(line => line.startsWith('NEXT_STEPS:'));
      
      const possibleConditions = lines
        .slice(possibleConditionsStart + 1, recommendationsStart > 0 ? recommendationsStart : lines.length)
        .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
        .map(line => line.replace(/^[-•]\s*/, '').trim())
        .filter(condition => condition.length > 0);

      const recommendations = lines
        .slice(recommendationsStart + 1, nextStepsStart > 0 ? nextStepsStart : lines.length)
        .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
        .map(line => line.replace(/^[-•]\s*/, '').trim())
        .filter(rec => rec.length > 0);

      const nextSteps = lines
        .slice(nextStepsStart + 1)
        .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
        .map(line => line.replace(/^[-•]\s*/, '').trim())
        .filter(step => step.length > 0);

      return {
        assessment,
        urgencyLevel,
        possibleConditions: possibleConditions.length > 0 ? possibleConditions : ['General health concern requiring evaluation'],
        recommendations: recommendations.length > 0 ? recommendations : ['Consult with a healthcare provider'],
        nextSteps: nextSteps.length > 0 ? nextSteps : ['Schedule an appointment with your doctor']
      };
    } catch (error) {
      console.error('Error analyzing symptoms:', error);
      return {
        assessment: 'Unable to analyze symptoms at this time',
        urgencyLevel: 'medium',
        possibleConditions: ['General health concern requiring evaluation'],
        recommendations: ['Please consult with a healthcare provider'],
        nextSteps: ['Schedule an appointment with your doctor']
      };
    }
  }
}

// Export singleton instance
export const gpt4Service = new GPT4Service();
export { GPT4Service };
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
  ) {
    const prompt = `Analyze: "${symptomDescription}"\nContext: ${JSON.stringify(patientContext)}\nFormat:\nASSESSMENT: ...\nURGENCY: ...\nRECOMMENDATIONS:\n- ...`;
    const res = await this.generateResponse(prompt, [], patientContext, null);
    const parsed = this.parseAnalysis(res);
    return { ...parsed, confidence: 75 };
  }
}

export const gpt4Service = new GPT4Service();
export { GPT4Service };
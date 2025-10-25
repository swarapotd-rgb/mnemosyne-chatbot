// src/services/aiService.ts
import mockResponses from './mockResponses';

interface GeminiResponse {
  candidates: Array<{
    content: { parts: Array<{ text: string }> };
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
  private model = 'gemini-pro';
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
  private useMockResponses = true;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || import.meta.env.VITE_GEMINI_API_KEY || '';
  }

  /* ---------- MOCK FORMATTING (no confidence, no menu) ---------- */
  private formatMockResponse(analysis: any): string {
    return `Based on your symptoms, here's my analysis:

Assessment: ${analysis.assessment}

Urgency Level: ${analysis.urgencyLevel.toUpperCase()}

Possible Conditions:
${analysis.possibleConditions.map((condition: string) => `• ${condition}`).join('\n')}

Recommendations:
${analysis.recommendations.map((r: string) => `• ${r}`).join('\n')}`;
  }

  /* ---------- REAL GEMINI CALL ---------- */
  private async generateGeminiResponse(messages: string[]): Promise<string> {
    const url = `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: messages.map(t => ({ text: t })) }],
        generationConfig: { temperature: 0.7, topK: 40, topP: 1, maxOutputTokens: 2048 },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
        ]
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(`Gemini error: ${err.error?.message ?? 'unknown'}`);
    }
    const data = (await res.json()) as GeminiResponse;
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  }

  /* ---------- PARSE GEMINI ANALYSIS (no confidence) ---------- */
  private parseGeminiAnalysis(text: string): {
    assessment: string;
    urgencyLevel: 'low' | 'medium' | 'high' | 'emergency';
    recommendations: string[];
  } {
    const lines = text.split('\n');
    const assessment = lines.find(l => l.startsWith('ASSESSMENT:'))?.replace('ASSESSMENT:', '').trim() ?? '…';
    const urgencyRaw = lines.find(l => l.startsWith('URGENCY:'))?.replace('URGENCY:', '').trim().toLowerCase();
    const urgencyLevel: 'low' | 'medium' | 'high' | 'emergency' =
      ['low', 'medium', 'high', 'emergency'].includes(urgencyRaw as any) ? (urgencyRaw as any) : 'medium';
    const recs = lines
      .filter(l => l.trim().startsWith('-') || l.trim().startsWith('•'))
      .map(l => l.replace(/^[-•]\s*/, '').trim());

    return { assessment, urgencyLevel, recommendations: recs.length ? recs : ['Consult a healthcare provider'] };
  }

  /* ---------- BUILD 4-SECTION BLOCK (mock + real) ---------- */
  private async buildSelfContainedAnswers(
    analysis: { assessment: string; recommendations: string[] }
  ): Promise<string> {
    // ---- MOCK ----
    if (this.useMockResponses || !this.apiKey) {
      return `

**1. Detailed recommendation explanation**
• Rest in a quiet, dark room – reduces sensory overload.
• Stay hydrated – dehydration worsens headaches.
• Try OTC pain relievers – follow package dosing.
• Apply a cold/warm compress – choose whichever feels better.

**2. Finding healthcare providers**
Search “primary care near me” on Google Maps, use Zocdoc, or call your insurance provider.

**3. Additional self-care tips**
- Keep a symptom diary
- Avoid known triggers (caffeine, loud noise)
- Practice deep-breathing or mindfulness

**4. Common questions & answers**
**Q:** How long should I rest before trying medication?  
**A:** Rest for 15-30 minutes first; if pain persists, take an OTC pain reliever.

**Q:** When should I see a doctor?  
**A:** If the headache lasts >72 h, is the worst you’ve ever had, or is accompanied by fever, confusion, or vision loss.

**Q:** Could this be a migraine?  
**A:** Possible if you have throbbing pain, nausea, or light sensitivity. Track symptoms for a clearer picture.`;
    }

    // ---- REAL GEMINI ----
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

    const raw = await this.generateGeminiResponse([prompt]);
    return raw.trim();
  }

  /* ---------- MAIN generateResponse ---------- */
  async generateResponse(
    userInput: string,
    conversationHistory: Array<{ botMessage: string; userResponse?: string }>,
    patientContext: PatientContext,
    symptomAnalysis: SymptomAnalysis | null
  ): Promise<string> {
    // ---- MOCK ----
    if (this.useMockResponses || !this.apiKey) {
      await new Promise(r => setTimeout(r, 1000));
      if (conversationHistory.length === 0) return mockResponses.conversations.greeting;

      let mock: any;
      const low = userInput.toLowerCase();
      if (low.includes('fever') || low.includes('temperature')) mock = mockResponses.symptomAnalysis.fever;
      else if (low.includes('headache') || low.includes('head pain')) mock = mockResponses.symptomAnalysis.headache;
      else mock = mockResponses.symptomAnalysis.default;

      const summary = this.formatMockResponse(mock);
      const details = await this.buildSelfContainedAnswers(mock);
      return `${summary}\n\n${details}`;
    }

    // ---- REAL GEMINI ----
    try {
      const system = this.buildSystemPrompt(patientContext, symptomAnalysis);
      const hist = this.buildConversationHistory(conversationHistory);
      const messages = [system, ...hist, userInput];

      const geminiReply = await this.generateGeminiResponse(messages);
      const parsed = this.parseGeminiAnalysis(geminiReply);

      const summary = `Based on your symptoms, here's my analysis:

Assessment: ${parsed.assessment}

Urgency Level: ${parsed.urgencyLevel.toUpperCase()}

Recommendations:
${parsed.recommendations.map(r => `• ${r}`).join('\n')}`;

      const details = await this.buildSelfContainedAnswers(parsed);
      return `${summary}\n\n${details}`;
    } catch (e: any) {
      console.error('AI Service Error:', e);
      return `I apologize, but I'm experiencing technical difficulties. ${e.message}`;
    }
  }

  /* ---------- analyzeSymptoms (required) ---------- */
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
    // ---- MOCK ----
    if (this.useMockResponses || !this.apiKey) {
      await new Promise(r => setTimeout(r, 1000));
      const s = symptomDescription.toLowerCase();
      if (s.includes('fever')) return { ...mockResponses.symptomAnalysis.fever, confidence: 75 };
      if (s.includes('headache')) return { ...mockResponses.symptomAnalysis.headache, confidence: 70 };
      return { ...mockResponses.symptomAnalysis.default, confidence: 60 };
    }

    // ---- REAL GEMINI ----
    try {
      const prompt = `Analyze the following symptoms and provide a structured assessment.

Symptoms: ${symptomDescription}
Additional Info: ${additionalInfo || 'None'}
Patient Context: ${JSON.stringify(patientContext)}

Required response format:
ASSESSMENT: [Clear description]
URGENCY: [low/medium/high/emergency]
RECOMMENDATIONS:
- [First recommendation]
- [Additional recommendations]`;

      const response = await this.generateGeminiResponse([prompt]);
      const lines = response.split('\n');

      const assessment = lines.find(l => l.startsWith('ASSESSMENT:'))?.replace('ASSESSMENT:', '').trim() || 'Assessment pending';
      const urgencyRaw = lines.find(l => l.startsWith('URGENCY:'))?.replace('URGENCY:', '').trim().toLowerCase();
      const urgencyLevel = ['low', 'medium', 'high', 'emergency'].includes(urgencyRaw as any)
        ? (urgencyRaw as any)
        : 'medium';
      const recommendations = lines
        .filter(l => l.trim().startsWith('-') || l.trim().startsWith('•'))
        .map(l => l.replace(/^[-•]\s*/, '').trim());

      return {
        assessment,
        confidence: 75,
        urgencyLevel,
        recommendations: recommendations.length ? recommendations : ['Consult a healthcare provider']
      };
    } catch (e: any) {
      console.error('analyzeSymptoms error:', e);
      return {
        assessment: 'Unable to analyze symptoms',
        confidence: 0,
        urgencyLevel: 'medium',
        recommendations: ['Please consult a healthcare provider'],
        error: e.message
      };
    }
  }

  /* ---------- HELPERS ---------- */
  private buildSystemPrompt(patientContext: PatientContext, symptomAnalysis: SymptomAnalysis | null): string {
    let p = `You are Mnemosyne, an AI Health Companion designed to help users explore their symptoms and guide them to appropriate care.

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

    if (patientContext.chronicConditions.length) p += `\n- Chronic conditions: ${patientContext.chronicConditions.join(', ')}`;
    if (patientContext.medications.length) p += `\n- Current medications: ${patientContext.medications.join(', ')}`;
    if (patientContext.age) p += `\n- Age: ${patientContext.age}`;
    if (patientContext.gender) p += `\n- Gender: ${patientContext.gender}`;

    if (symptomAnalysis) {
      p += `\n\nCURRENT SYMPTOM ANALYSIS:
- Primary symptom: ${symptomAnalysis.primarySymptom}
- Duration: ${symptomAnalysis.duration}
- Severity (1-10): ${symptomAnalysis.severity}
- Associated symptoms: ${symptomAnalysis.associatedSymptoms.join(', ') || 'None'}
- Triggers: ${symptomAnalysis.triggers.join(', ') || 'None'}
- Urgency level: ${symptomAnalysis.urgencyLevel}`;
    }

    return p;
  }

  private buildConversationHistory(
    history: Array<{ botMessage: string; userResponse?: string }>
  ): string[] {
    const out: string[] = [];
    history.forEach(s => {
      out.push(`Assistant: ${s.botMessage}`);
      if (s.userResponse) out.push(`User: ${s.userResponse}`);
    });
    return out;
  }

  async generateFollowUpQuestions(
    currentSymptoms: string,
    patientContext: PatientContext,
    conversationHistory: Array<{ botMessage: string; userResponse?: string }>
  ): Promise<string[]> {
    if (this.useMockResponses || !this.apiKey) {
      await new Promise(r => setTimeout(r, 500));
      return mockResponses.conversations.followUp;
    }

    const prompt = `Generate 3 relevant follow-up questions for the symptoms: "${currentSymptoms}". Return only the questions, one per line.`;
    const res = await this.generateGeminiResponse([prompt]);
    return res.split('\n').filter(q => q.trim());
  }

  setApiKey(key: string) { this.apiKey = key; }
  setUseMockResponses(mock: boolean) { this.useMockResponses = mock; }
}

export const aiService = new AIService();
export { AIService };
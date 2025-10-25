import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const GOOGLE_AI_KEY = process.env.GOOGLE_AI_KEY;

if (!GOOGLE_AI_KEY) {
    throw new Error('GOOGLE_AI_KEY is not set in environment variables');
}

const genAI = new GoogleGenerativeAI(GOOGLE_AI_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

export interface ProcessedMedicalData {
    symptoms: string[];
    summary: string;
    insights: {
        symptomTrends: string[];
        progressNotes: string;
        lifestyleTips: string[];
        redFlags: string[];
    };
}

export const processMedicalJourney = async (journeyDescription: string): Promise<ProcessedMedicalData> => {
    try {
        if (!journeyDescription) {
            throw new Error('Journey description is required');
        }

        console.log('Processing medical journey:', journeyDescription);

        // Create a more structured prompt
        const prompt = `
        Please analyze the following medical update and provide a structured response.
        
        Patient Update: "${journeyDescription}"

        Provide a structured analysis following this format:
        - First, a brief summary of the situation
        - Then, list any symptoms mentioned
        - Note any concerning signs that need attention
        - Finally, suggest some general health maintenance tips

        Please be factual and avoid making diagnoses.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log('AI Response:', text);

        // Parse the response into sections
        const sections = text.split('\n\n');
        const summary = sections[0] || '';
        
        // Extract symptoms (looking for bullet points or numbered lists)
        const symptoms = text.match(/[-•*]\s*([^\n]+)/g)?.map(s => s.replace(/[-•*]\s*/, '')) || [];
        
        // Look for any red flags or concerns
        const redFlags = text.toLowerCase().includes('concern') || text.toLowerCase().includes('attention') ?
            text.match(/[-•*]\s*([^\n]+concern[^\n]+)/gi)?.map(s => s.replace(/[-•*]\s*/, '')) || [] :
            [];

        // Extract any lifestyle or health tips
        const tips = text.toLowerCase().includes('tip') || text.toLowerCase().includes('recommend') ?
            text.match(/[-•*]\s*([^\n]+(?:tip|recommend)[^\n]+)/gi)?.map(s => s.replace(/[-•*]\s*/, '')) || [] :
            [];

        return {
            symptoms,
            summary,
            insights: {
                symptomTrends: [],  // This would require historical data
                progressNotes: text,
                lifestyleTips: tips,
                redFlags
            }
        };
    } catch (error) {
        console.error('Error in processMedicalJourney:', error);
        throw new Error('Failed to process medical journey');
    }
};
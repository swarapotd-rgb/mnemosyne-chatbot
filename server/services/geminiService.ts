import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY || '');
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
        const prompt = `
        Analyze the following patient journey description and provide a structured response in the following format:

        Summary: Brief overview of the situation.
        
        Symptoms: List all mentioned symptoms, separated by commas.
        
        Trends: Any patterns or changes in symptoms over time.
        
        Progress: Notable changes in condition.
        
        Lifestyle Tips: General wellness suggestions based on the description.
        
        Red Flags: Any concerning symptoms that need immediate medical attention.

        Note: Do not provide diagnoses or medical advice.

        Patient Journey:
        ${journeyDescription}
        
        Please ensure each section is clearly labeled and ends with a period.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Process the response into structured data
        // This is a simplified example - you would need more robust parsing
        const processedData: ProcessedMedicalData = {
            symptoms: extractSymptoms(text),
            summary: generateSummary(text),
            insights: {
                symptomTrends: extractSymptomTrends(text),
                progressNotes: extractProgressNotes(text),
                lifestyleTips: extractLifestyleTips(text),
                redFlags: extractRedFlags(text)
            }
        };

        return processedData;
    } catch (error) {
        console.error('Error processing medical journey:', error);
        throw new Error(`Failed to process medical journey: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

// Helper functions to extract specific information
const extractSymptoms = (text: string): string[] => {
    const symptomsRegex = /symptoms?:?\s*([^.]*\.)/i;
    const match = text.match(symptomsRegex);
    if (match && match[1]) {
        return match[1]
            .split(/,|\sand\s/)
            .map(s => s.trim())
            .filter(s => s.length > 0);
    }
    return [];
};

const generateSummary = (text: string): string => {
    const summaryRegex = /summary:?\s*([^.]*\.)/i;
    const match = text.match(summaryRegex);
    return match ? match[1].trim() : text.split('.')[0].trim();
};

const extractSymptomTrends = (text: string): string[] => {
    const trendsRegex = /trends?:?\s*([^.]*\.)/i;
    const match = text.match(trendsRegex);
    if (match && match[1]) {
        return match[1]
            .split(/,|\sand\s/)
            .map(s => s.trim())
            .filter(s => s.length > 0);
    }
    return [];
};

const extractProgressNotes = (text: string): string => {
    const notesRegex = /progress:?\s*([^.]*\.)/i;
    const match = text.match(notesRegex);
    return match ? match[1].trim() : '';
};

const extractLifestyleTips = (text: string): string[] => {
    const tipsRegex = /lifestyle tips:?\s*([^.]*\.)/i;
    const match = text.match(tipsRegex);
    if (match && match[1]) {
        return match[1]
            .split(/,|\sand\s/)
            .map(s => s.trim())
            .filter(s => s.length > 0);
    }
    return [];
};

const extractRedFlags = (text: string): string[] => {
    const flagsRegex = /red flags:?\s*([^.]*\.)/i;
    const match = text.match(flagsRegex);
    if (match && match[1]) {
        return match[1]
            .split(/,|\sand\s/)
            .map(s => s.trim())
            .filter(s => s.length > 0);
    }
    return [];
};
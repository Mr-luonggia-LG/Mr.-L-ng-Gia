import { GoogleGenAI, Chat, Type, GenerateContentResponse, Modality } from "@google/genai";
import { GrammarCorrection, VocabularyItem } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// The history type expected by the Gemini API for initializing a chat
// FIX: Export ApiHistoryContent to be used for type annotations in other files.
export interface ApiHistoryContent {
    role: 'user' | 'model';
    parts: { text: string }[];
}

export const startChatSession = (systemInstruction: string, history?: ApiHistoryContent[]): Chat => {
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        history: history,
        config: {
            systemInstruction: systemInstruction,
            temperature: 0.7,
            topP: 0.9,
            topK: 40,
        },
    });
};

export const correctGrammar = async (text: string): Promise<GrammarCorrection> => {
    const prompt = `You are an expert English grammar checker. Your task is to correct the provided text and explain the errors in a clear and simple manner.
    Please respond ONLY with a valid JSON object.
    The JSON object should have two keys: "correction" (the corrected sentence) and "explanation" (a brief explanation of the mistakes).
    Do not add any text before or after the JSON object.

    Text to correct: "${text}"`;

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    correction: { type: Type.STRING },
                    explanation: { type: Type.STRING }
                },
                required: ["correction", "explanation"]
            }
        }
    });

    const jsonString = response.text;
    try {
        return JSON.parse(jsonString);
    } catch (e) {
        console.error("Failed to parse JSON from Gemini for grammar correction:", jsonString);
        throw new Error("Received an invalid format from the AI.");
    }
};

export const generateVocabulary = async (topic: string): Promise<VocabularyItem[]> => {
    const prompt = `You are an expert English vocabulary teacher. Generate a list of 8 useful vocabulary words related to the topic: "${topic}".
    For each word, provide its part of speech (e.g., noun, verb, adjective), a clear definition in English, and an example sentence.
    Please respond ONLY with a valid JSON object.
    The JSON object should be an array of objects, where each object has four keys: "word", "pos", "definition", and "example".
    Do not add any text before or after the JSON object.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        word: { type: Type.STRING },
                        pos: { type: Type.STRING },
                        definition: { type: Type.STRING },
                        example: { type: Type.STRING }
                    },
                    required: ["word", "pos", "definition", "example"]
                }
            }
        }
    });
    
    const jsonString = response.text;
    try {
        return JSON.parse(jsonString);
    } catch (e) {
        console.error("Failed to parse JSON from Gemini for vocabulary generation:", jsonString);
        throw new Error("Received an invalid format from the AI.");
    }
};

export const generatePronunciationAudio = async (text: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
            },
        },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
        return base64Audio;
    } else {
        console.error("Audio generation failed. Full response:", JSON.stringify(response, null, 2));
        throw new Error("Failed to generate audio. No audio data received.");
    }
};
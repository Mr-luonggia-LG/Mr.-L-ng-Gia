import { GoogleGenAI, Type, Modality, Content, LiveSession, LiveServerMessage, Chat } from '@google/genai';
import {
    GrammarCorrection,
    VocabularyItem,
    IdiomItem,
    MindMapData,
    LessonPlan,
    ExerciseSet,
    DailyPracticeContent,
    KnowledgeResult,
    GroundingSource,
} from '../types';

export type { Content as ApiHistoryContent };

// Create a single, reusable AI instance
const apiKey = process.env.API_KEY;
if (!apiKey) {
    throw new Error("API key not found. Please ensure it is configured in the environment.");
}
const ai = new GoogleGenAI({ apiKey });


const textModel = 'gemini-2.5-flash';
const proModel = 'gemini-2.5-pro';
const ttsModel = 'gemini-2.5-flash-preview-tts';
const liveModel = 'gemini-2.5-flash-native-audio-preview-09-2025';


// --- CHAT ---
export const startChatSession = (systemInstruction: string, history?: Content[]): Chat => {
    return ai.chats.create({
        model: proModel,
        history: history,
        config: {
            systemInstruction: systemInstruction,
        }
    });
};

// --- LIVE CHAT ---
// This requires a new instance each time to use the key from the aistudio dialog.
export const startLiveChatSession = async (
    systemInstruction: string,
    callbacks: {
        onopen: () => void;
        onmessage: (message: LiveServerMessage) => Promise<void>;
        onerror: (e: ErrorEvent) => void;
        onclose: (e: CloseEvent) => void;
    }
): Promise<LiveSession> => {
    const liveApiKey = process.env.API_KEY;
    if (!liveApiKey) {
        throw new Error("API key is not available for Live Session.");
    }
    const liveAi = new GoogleGenAI({ apiKey: liveApiKey });

    return liveAi.live.connect({
        model: liveModel,
        callbacks: callbacks,
        config: {
            responseModalities: [Modality.AUDIO],
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            systemInstruction: systemInstruction,
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } },
            },
        },
    });
};


// --- GRAMMAR ---
export const correctGrammar = async (text: string): Promise<GrammarCorrection> => {
    const prompt = `Correct the following English text. Provide the corrected version and a simple, brief explanation of the mistakes in both English and Vietnamese. The user's text is: "${text}"`;
    const response = await ai.models.generateContent({
        model: textModel,
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    correction: { type: Type.STRING },
                    explanation_en: { type: Type.STRING },
                    explanation_vi: { type: Type.STRING },
                },
                required: ['correction', 'explanation_en', 'explanation_vi'],
            },
        },
    });
    return JSON.parse(response.text.trim());
};


// --- PRONUNCIATION / TTS ---
export const generatePronunciationAudio = async (text: string): Promise<string> => {
     const response = await ai.models.generateContent({
        model: ttsModel,
        contents: [{ parts: [{ text: `Say this clearly: ${text}` }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } },
            },
        },
     });
     
     const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
     if (!audioData) {
        throw new Error("No audio data was generated.");
     }
     return audioData;
};


// --- VOCABULARY ---
export const generateVocabulary = async (topic: string): Promise<VocabularyItem[]> => {
    const prompt = `Generate a list of 5-7 useful English vocabulary words related to the topic "${topic}". For each word, provide its part of speech (e.g., noun, verb, adjective), a clear definition, and an example sentence.`;
    const response = await ai.models.generateContent({
        model: textModel,
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        word: { type: Type.STRING },
                        pos: { type: Type.STRING },
                        definition: { type: Type.STRING },
                        example: { type: Type.STRING },
                    },
                    required: ['word', 'pos', 'definition', 'example'],
                },
            },
        },
    });
    return JSON.parse(response.text.trim());
};

// --- TRANSLATION ---
export const translateText = async (text: string, sourceLang: string, targetLang: string): Promise<string> => {
    const prompt = `Translate the following text from ${sourceLang} to ${targetLang}. Provide only the translated text, with no extra explanations or phrases.\n\nText: "${text}"`;
    const response = await ai.models.generateContent({ model: textModel, contents: prompt });
    return response.text.trim();
};

// --- IDIOMS ---
export const generateIdioms = async (topic: string): Promise<IdiomItem[]> => {
    const prompt = `Generate a list of 3-5 common English idioms related to the topic "${topic}". For each idiom, provide its meaning, an example sentence, and its closest Vietnamese equivalent.`;
    const response = await ai.models.generateContent({
        model: textModel,
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        idiom: { type: Type.STRING },
                        meaning: { type: Type.STRING },
                        example: { type: Type.STRING },
                        vietnamese_equivalent: { type: Type.STRING },
                    },
                    required: ['idiom', 'meaning', 'example', 'vietnamese_equivalent'],
                }
            }
        }
    });
    return JSON.parse(response.text.trim());
};

// --- LESSON PLAN ---
export const generateLessonPlan = async (topic: string, level: string, duration: number): Promise<LessonPlan> => {
    const prompt = `Create a detailed English lesson plan for a ${duration}-minute class on the topic "${topic}" for ${level} level students. The plan should include clear objectives, a warm-up, presentation of new material, a practice activity, and a production/application activity. Also, suggest a simple homework assignment. Structure the output as a JSON object.`;
    const response = await ai.models.generateContent({
        model: proModel,
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    topic: { type: Type.STRING },
                    level: { type: Type.STRING },
                    totalDuration: { type: Type.NUMBER },
                    objectives: { type: Type.ARRAY, items: { type: Type.STRING } },
                    warmUp: { type: Type.OBJECT, properties: { duration: { type: Type.NUMBER }, activity: { type: Type.STRING } } },
                    presentation: { type: Type.OBJECT, properties: { duration: { type: Type.NUMBER }, activity: { type: Type.STRING } } },
                    practice: { type: Type.OBJECT, properties: { duration: { type: Type.NUMBER }, activity: { type: Type.STRING } } },
                    production: { type: Type.OBJECT, properties: { duration: { type: Type.NUMBER }, activity: { type: Type.STRING } } },
                    homework: { type: Type.STRING }
                },
            }
        }
    });
    return JSON.parse(response.text.trim());
};


// --- EXERCISES ---
export const generateExercises = async (topic: string, level: string, count: number): Promise<ExerciseSet> => {
    const prompt = `Generate a set of ${count} English exercises for an ${level} level student on the topic "${topic}". Include a mix of multiple-choice and fill-in-the-blank questions. For each exercise, provide the type, question, options (for multiple-choice), the correct answer, and a brief explanation.`;
    const response = await ai.models.generateContent({
        model: proModel,
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    topic: { type: Type.STRING },
                    level: { type: Type.STRING },
                    exercises: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                type: { type: Type.STRING, enum: ['multiple_choice', 'fill_in_the_blank'] },
                                question: { type: Type.STRING },
                                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                                answer: { type: Type.STRING },
                                explanation: { type: Type.STRING },
                            },
                            required: ['type', 'question', 'answer', 'explanation']
                        }
                    }
                }
            }
        }
    });
    return JSON.parse(response.text.trim());
};


// --- MIND MAP ---
export const generateMindMapData = async (topic: string): Promise<MindMapData> => {
     throw new Error("Mind Map generation is not supported in this deployment model.");
};

// --- DAILY PRACTICE ---
export const generateDailyPractice = async (day: number, level: string): Promise<DailyPracticeContent> => {
    const prompt = `Generate a daily English practice set for a ${level} level student, for day ${day} of a 30-day challenge. The set must include: 1. A list of 3 vocabulary words with definitions and examples. 2. One grammar exercise (multiple choice). 3. One interesting sentence for pronunciation practice.`;
    const response = await ai.models.generateContent({
        model: proModel,
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    vocabulary: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                word: { type: Type.STRING },
                                pos: { type: Type.STRING },
                                definition: { type: Type.STRING },
                                example: { type: Type.STRING },
                            },
                            required: ['word', 'pos', 'definition', 'example']
                        }
                    },
                    grammar: {
                        type: Type.OBJECT,
                        properties: {
                            type: { type: Type.STRING, enum: ['multiple_choice'] },
                            question: { type: Type.STRING },
                            options: { type: Type.ARRAY, items: { type: Type.STRING } },
                            answer: { type: Type.STRING },
                            explanation: { type: Type.STRING },
                        },
                        required: ['type', 'question', 'options', 'answer', 'explanation']
                    },
                    pronunciation: { type: Type.STRING }
                },
                required: ['vocabulary', 'grammar', 'pronunciation']
            }
        }
    });
    return JSON.parse(response.text.trim());
};


// --- KNOWLEDGE HUB ---
export const gatherKnowledge = async (topic: string): Promise<KnowledgeResult> => {
    const prompt = `Provide a comprehensive and well-structured summary on the topic: "${topic}". The summary should be easy to understand for an English language learner. Use markdown for formatting (bold, italics, lists).`;
    
    const response = await ai.models.generateContent({
        model: proModel,
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });
    
    const summary = response.text;
    const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    const sourceMap = new Map<string, GroundingSource>();
    for (const chunk of rawChunks) {
        // Type assertion to access web property
        const webChunk = chunk as { web?: { uri: string, title: string } };
        if (webChunk.web?.uri) {
            sourceMap.set(webChunk.web.uri, {
                uri: webChunk.web.uri,
                title: webChunk.web.title || webChunk.web.uri,
            });
        }
    }
    
    return { summary, sources: Array.from(sourceMap.values()) };
};

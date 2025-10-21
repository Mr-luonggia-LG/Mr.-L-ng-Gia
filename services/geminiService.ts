// FIX: Removed 'History' from import as it is not an exported member of '@google/genai'.
import { GoogleGenAI, Type, Modality, Content } from '@google/genai';
import {
    GrammarCorrection,
    VocabularyItem,
    IdiomItem,
    MindMapData,
    LessonPlan,
    ExerciseSet,
} from '../types';

// This allows other files to import this type from the service.
export type { Content as ApiHistoryContent };

// Initialize the client once and reuse it.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const textModel = 'gemini-2.5-flash';
const proModel = 'gemini-2.5-pro';
const ttsModel = 'gemini-2.5-flash-preview-tts';

// --- CHAT ---

// FIX: Changed the type of the 'history' parameter from the non-existent 'History' to 'Content[]'.
export const startChatSession = (systemInstruction: string, history?: Content[]) => {
    return ai.chats.create({
        model: proModel,
        config: {
            systemInstruction: systemInstruction,
        },
        history: history,
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
                    explanation_en: { type: Type.STRING, description: "Explanation in English" },
                    explanation_vi: { type: Type.STRING, description: "Explanation in Vietnamese" },
                },
                required: ['correction', 'explanation_en', 'explanation_vi'],
            },
        },
    });

    const jsonString = response.text.trim();
    try {
        return JSON.parse(jsonString) as GrammarCorrection;
    } catch (e) {
        console.error("Failed to parse JSON for grammar correction:", jsonString);
        throw new Error("The model returned an invalid format. Please try again.");
    }
};


// --- PRONUNCIATION / TTS ---

export const generatePronunciationAudio = async (text: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: ttsModel,
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
    if (!base64Audio) {
        throw new Error("No audio data received from the API.");
    }
    return base64Audio;
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
                        pos: { type: Type.STRING, description: "Part of speech (e.g., noun, verb, adjective)" },
                        definition: { type: Type.STRING },
                        example: { type: Type.STRING },
                    },
                    required: ['word', 'pos', 'definition', 'example'],
                },
            },
        },
    });
    
    const jsonString = response.text.trim();
    try {
        return JSON.parse(jsonString) as VocabularyItem[];
    } catch (e) {
        console.error("Failed to parse JSON for vocabulary:", jsonString);
        throw new Error("The model returned an invalid format. Please try again.");
    }
};

// --- TRANSLATION ---

export const translateText = async (text: string, sourceLang: string, targetLang: string): Promise<string> => {
    const prompt = `Translate the following text from ${sourceLang} to ${targetLang}. Provide only the translated text, with no extra explanations or phrases.\n\nText: "${text}"`;
    
    const response = await ai.models.generateContent({
        model: textModel,
        contents: prompt,
    });
    
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

    const jsonString = response.text.trim();
    try {
        return JSON.parse(jsonString) as IdiomItem[];
    } catch (e) {
        console.error("Failed to parse JSON for idioms:", jsonString);
        throw new Error("The model returned an invalid format. Please try again.");
    }
};


// --- LESSON PLAN ---

export const generateLessonPlan = async (topic: string, level: string, duration: number): Promise<LessonPlan> => {
    const prompt = `Create a detailed English lesson plan for a ${duration}-minute class on the topic "${topic}" for ${level} level students. The plan should include clear objectives, a warm-up activity, presentation of new material, a practice activity, and a production activity where students use the new language. Also suggest a homework assignment. Structure each activity with a suggested duration in minutes and a description. The total duration of all activities should equal the lesson duration.`;

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
                    totalDuration: { type: Type.INTEGER },
                    objectives: { type: Type.ARRAY, items: { type: Type.STRING } },
                    warmUp: {
                        type: Type.OBJECT,
                        properties: { duration: { type: Type.INTEGER }, activity: { type: Type.STRING } },
                        required: ['duration', 'activity'],
                    },
                    presentation: {
                        type: Type.OBJECT,
                        properties: { duration: { type: Type.INTEGER }, activity: { type: Type.STRING } },
                        required: ['duration', 'activity'],
                    },
                    practice: {
                        type: Type.OBJECT,
                        properties: { duration: { type: Type.INTEGER }, activity: { type: Type.STRING } },
                        required: ['duration', 'activity'],
                    },
                    production: {
                        type: Type.OBJECT,
                        properties: { duration: { type: Type.INTEGER }, activity: { type: Type.STRING } },
                        required: ['duration', 'activity'],
                    },
                    homework: { type: Type.STRING },
                },
                 required: ['topic', 'level', 'totalDuration', 'objectives', 'warmUp', 'presentation', 'practice', 'production', 'homework']
            },
        },
    });

    const jsonString = response.text.trim();
    try {
        return JSON.parse(jsonString) as LessonPlan;
    } catch (e) {
        console.error("Failed to parse JSON for lesson plan:", jsonString);
        throw new Error("The model returned an invalid format. Please try again.");
    }
};

// --- EXERCISES ---

export const generateExercises = async (topic: string, level: string, count: number): Promise<ExerciseSet> => {
    const prompt = `Generate a set of ${count} English exercises for an ${level} level student on the topic "${topic}". Include a mix of multiple-choice and fill-in-the-blank questions. For each exercise, provide the type, the question, options (for multiple-choice), the correct answer, and a brief explanation for the answer.`;

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
                                type: { type: Type.STRING, description: "Can be 'multiple_choice' or 'fill_in_the_blank'" },
                                question: { type: Type.STRING },
                                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                                answer: { type: Type.STRING },
                                explanation: { type: Type.STRING },
                            },
                            required: ['type', 'question', 'answer', 'explanation'],
                        }
                    }
                },
                required: ['topic', 'level', 'exercises'],
            }
        }
    });

    const jsonString = response.text.trim();
    try {
        return JSON.parse(jsonString) as ExerciseSet;
    } catch (e) {
        console.error("Failed to parse JSON for exercises:", jsonString);
        throw new Error("The model returned an invalid format. Please try again.");
    }
};


// --- MIND MAP ---
export const generateMindMapData = async (topic: string): Promise<MindMapData> => {
    const prompt = `Generate the data for a mind map about "${topic}". The mind map should have a central topic and several main branches, each with a few sub-branches.
    - The central node should have id "1".
    - Create 4-5 main branch nodes with ids "2", "3", "4", etc.
    - Create 2-3 sub-branch nodes for each main branch.
    - Provide the data as a JSON object with two keys: "nodes" and "edges".
    - "nodes" should be an array of objects, each with an "id" (string), "type" (the central node should be "input", others "default"), and "data" (an object with a "label" string).
    - "edges" should be an array of objects, each with an "id" (e.g., "e1-2"), a "source" (parent node id), and a "target" (child node id).`;
    
    const response = await ai.models.generateContent({
        model: proModel,
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    nodes: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.STRING },
                                type: { type: Type.STRING },
                                data: {
                                    type: Type.OBJECT,
                                    properties: {
                                        label: { type: Type.STRING },
                                    },
                                    required: ['label'],
                                },
                            },
                            required: ['id', 'type', 'data'],
                        },
                    },
                    edges: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.STRING },
                                source: { type: Type.STRING },
                                target: { type: Type.STRING },
                            },
                             required: ['id', 'source', 'target'],
                        }
                    },
                },
                required: ['nodes', 'edges'],
            },
        },
    });

    const jsonString = response.text.trim();
    try {
        return JSON.parse(jsonString) as MindMapData;
    } catch (e) {
        console.error("Failed to parse JSON for mind map:", jsonString);
        throw new Error("The model returned an invalid format. Please try again.");
    }
};
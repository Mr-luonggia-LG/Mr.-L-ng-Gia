import type { Content } from '@google/genai';

export type View =
    | 'chat'
    | 'grammar'
    | 'vocabulary'
    | 'pronunciation'
    | 'translation'
    | 'idioms'
    | 'tenses'
    | 'lessonplan'
    | 'exercises';

export enum MessageSender {
    User = 'user',
    AI = 'ai',
}

export interface ChatMessage {
    sender: MessageSender;
    text: string;
}

export type ApiHistoryContent = Content;

export interface GrammarCorrection {
    correction: string;
    explanation_en: string;
    explanation_vi: string;
}

export interface VocabularyItem {
    word: string;
    pos: string; // Part of speech
    definition: string;
    example: string;
}

export interface IdiomItem {
    idiom: string;
    meaning: string;
    example: string;
    vietnamese_equivalent: string;
}

export interface TenseItem {
    category: string;
    name_en: string;
    name_vi: string;
    structure_active: string;
    structure_passive: string;
    usage_en: string[];
    usage_vi: string[];
    example_active_en: string;
    example_active_vi: string;
    example_passive_en: string;
    example_passive_vi: string;
}

export interface MindMapNode {
    id: string;
    type: 'input' | 'default';
    data: {
        label: string;
    };
    position?: { x: number, y: number };
}

export interface MindMapEdge {
    id: string;
    source: string;
    target: string;
}

export interface MindMapData {
    nodes: MindMapNode[];
    edges: MindMapEdge[];
}

export interface LessonPlanActivity {
    duration: number;
    activity: string;
}

export interface LessonPlan {
    topic: string;
    level: string;
    totalDuration: number;
    objectives: string[];
    warmUp: LessonPlanActivity;
    presentation: LessonPlanActivity;
    practice: LessonPlanActivity;
    production: LessonPlanActivity;
    homework: string;
}

export type ExerciseType = 'multiple_choice' | 'fill_in_the_blank';

export interface Exercise {
    type: ExerciseType;
    question: string;
    options?: string[]; // For multiple choice
    answer: string;
    explanation: string;
}

export interface ExerciseSet {
    topic: string;
    level: string;
    exercises: Exercise[];
}
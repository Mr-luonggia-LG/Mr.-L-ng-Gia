
export enum View {
  Chat = 'Chat',
  Grammar = 'Grammar',
  Vocabulary = 'Vocabulary',
  Pronunciation = 'Pronunciation',
}

export enum MessageSender {
    User = 'user',
    AI = 'ai',
}

export interface ChatMessage {
    sender: MessageSender;
    text: string;
}

export interface VocabularyItem {
    word: string;
    pos: string;
    definition: string;
    example: string;
}

export interface GrammarCorrection {
    correction: string;
    explanation: string;
}

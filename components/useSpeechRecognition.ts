import { useState, useEffect, useRef, useCallback } from 'react';

// FIX: Add type definitions for the Web Speech API to resolve TypeScript error.
// The Web Speech API is not part of standard TypeScript DOM typings.
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
    [index: number]: SpeechRecognitionResult;
    length: number;
}

interface SpeechRecognitionResult {
    [index: number]: SpeechRecognitionAlternative;
    length: number;
}

interface SpeechRecognitionAlternative {
    transcript: string;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;

    onstart: () => void;
    onend: () => void;
    onerror: (event: SpeechRecognitionErrorEvent) => void;
    onresult: (event: SpeechRecognitionEvent) => void;

    start(): void;
    stop(): void;
}

declare var SpeechRecognition: {
    prototype: SpeechRecognition;
    new(): SpeechRecognition;
};

declare var webkitSpeechRecognition: {
    prototype: SpeechRecognition;
    new(): SpeechRecognition;
};

interface UseSpeechRecognitionOptions {
    continuous?: boolean;
}

interface SpeechRecognitionHook {
    isListening: boolean;
    transcript: string;
    startListening: () => void;
    stopListening: () => void;
    hasRecognitionSupport: boolean;
}

const useSpeechRecognition = ({ continuous = false }: UseSpeechRecognitionOptions = {}): SpeechRecognitionHook => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    useEffect(() => {
        const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognitionAPI) {
            console.warn("Speech recognition not supported by this browser.");
            return;
        }

        recognitionRef.current = new SpeechRecognitionAPI();
        const recognition = recognitionRef.current;
        
        recognition.continuous = continuous;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
        };

        recognition.onresult = (event) => {
            const currentTranscript = Array.from(event.results)
                .map(result => result[0])
                .map(result => result.transcript)
                .join('');
            setTranscript(currentTranscript);
        };
        
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [continuous]);

    const startListening = useCallback(() => {
        if (recognitionRef.current && !isListening) {
            setTranscript('');
            recognitionRef.current.start();
        }
    }, [isListening]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
        }
    }, [isListening]);
    
    const hasRecognitionSupport = !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

    return { isListening, transcript, startListening, stopListening, hasRecognitionSupport };
};

export default useSpeechRecognition;

import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { LiveSession, LiveServerMessage } from '@google/genai';
import { startLiveChatSession } from '../services/geminiService';
import { createBlob, decode, decodeAudioData } from '../utils/audioUtils';
import { LiveChatIcon, SparklesIcon, UserIcon, MicrophoneIcon } from './IconComponents';
import LoadingSpinner from './LoadingSpinner';

type SessionStatus = 'idle' | 'connecting' | 'connected' | 'ended' | 'error';
type ConversationLevel = 'Beginner' | 'Intermediate' | 'Advanced';
type TranscriptEntry = {
    sender: 'user' | 'ai';
    text: string;
};

const getSystemInstruction = (level: ConversationLevel): string => {
    switch (level) {
        case 'Beginner':
            return "You are a friendly English teacher speaking to a beginner-level student. Use simple vocabulary and sentence structures. Speak clearly and a bit slower than usual. Ask basic questions and be very encouraging.";
        case 'Intermediate':
            return "You are an English conversation partner for an intermediate-level student. Speak at a normal pace using common, everyday language. Keep the conversation flowing and interesting. Ask questions to encourage the user to speak more.";
        case 'Advanced':
            return "You are an intelligent and articulate English conversation partner for an advanced-level student. Feel free to use sophisticated vocabulary, complex sentences, and discuss more abstract or nuanced topics. Challenge the user's thinking and language skills in a friendly manner.";
    }
};

const LiveChatView: React.FC = () => {
    const [status, setStatus] = useState<SessionStatus>('idle');
    const [level, setLevel] = useState<ConversationLevel>('Intermediate');
    const [error, setError] = useState<string | null>(null);
    const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
    
    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

    const nextStartTimeRef = useRef(0);
    const audioSourcesRef = useRef(new Set<AudioBufferSourceNode>());
    
    const currentInputTranscriptionRef = useRef('');
    const currentOutputTranscriptionRef = useRef('');
    const transcriptEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcripts]);
    
    const cleanup = useCallback(() => {
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current.onaudioprocess = null;
            scriptProcessorRef.current = null;
        }
        inputAudioContextRef.current?.close().catch(console.error);
        outputAudioContextRef.current?.close().catch(console.error);
        inputAudioContextRef.current = null;
        outputAudioContextRef.current = null;
        
        audioSourcesRef.current.forEach(source => source.stop());
        audioSourcesRef.current.clear();
        nextStartTimeRef.current = 0;

    }, []);

    const handleStop = useCallback(async () => {
        if (sessionPromiseRef.current) {
            try {
                const session = await sessionPromiseRef.current;
                session.close();
            } catch (e) {
                console.error("Error closing session:", e);
            }
        }
        cleanup();
        setStatus('ended');
        sessionPromiseRef.current = null;
    }, [cleanup]);

    const handleStart = useCallback(async () => {
        setError(null);
        setTranscripts([]);
        setStatus('connecting');

        try {
            mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            const systemInstruction = getSystemInstruction(level);

            sessionPromiseRef.current = startLiveChatSession(systemInstruction, {
                onopen: () => {
                    setStatus('connected');
                    if (!inputAudioContextRef.current || !mediaStreamRef.current) return;
                    
                    const source = inputAudioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
                    scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                    
                    scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                        const pcmBlob = createBlob(inputData);
                        
                        sessionPromiseRef.current?.then((session) => {
                            session.sendRealtimeInput({ media: pcmBlob });
                        }).catch(err => console.error("Session promise error in audioprocess:", err));
                    };

                    source.connect(scriptProcessorRef.current);
                    scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
                },
                onmessage: async (message: LiveServerMessage) => {
                    const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                    if (base64Audio && outputAudioContextRef.current) {
                        const outputCtx = outputAudioContextRef.current;
                        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                        
                        const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
                        const source = outputCtx.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(outputCtx.destination);
                        
                        source.onended = () => audioSourcesRef.current.delete(source);
                        audioSourcesRef.current.add(source);
                        
                        source.start(nextStartTimeRef.current);
                        nextStartTimeRef.current += audioBuffer.duration;
                    }

                    if (message.serverContent?.interrupted) {
                        audioSourcesRef.current.forEach(source => source.stop());
                        audioSourcesRef.current.clear();
                        nextStartTimeRef.current = 0;
                    }

                    if (message.serverContent?.inputTranscription) {
                        currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
                    }
                    if (message.serverContent?.outputTranscription) {
                         currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
                    }
                    if (message.serverContent?.turnComplete) {
                        setTranscripts(prev => [
                            ...prev,
                            { sender: 'user', text: currentInputTranscriptionRef.current },
                            { sender: 'ai', text: currentOutputTranscriptionRef.current }
                        ]);
                        currentInputTranscriptionRef.current = '';
                        currentOutputTranscriptionRef.current = '';
                    }
                },
                onerror: (e: ErrorEvent) => {
                    console.error("Session error:", e);
                    setError("A network error occurred during the session. The connection has been closed. Please try starting a new conversation.");
                    setStatus('error');
                    cleanup();
                },
                onclose: (e: CloseEvent) => {
                    setStatus('ended');
                    cleanup();
                },
            });

            await sessionPromiseRef.current;

        } catch (err) {
            console.error(err);
            const message = err instanceof Error ? err.message : "An unknown error occurred.";
            setError(`Failed to start session: ${message}. Please try again.`);
            setStatus('error');
            cleanup();
        }
    }, [level, cleanup]);

    const renderContent = () => {
        if (status === 'idle' || status === 'ended' || status === 'error') {
            return (
                <div className="max-w-md w-full">
                     <LiveChatIcon className="w-24 h-24 mx-auto text-blue-500" />
                     <h2 className="mt-4 text-2xl font-bold text-gray-800 dark:text-gray-200">Practice Speaking in Real-Time</h2>
                     <p className="mt-2 text-gray-600 dark:text-gray-400">Choose your level and start a live conversation with your AI partner.</p>
                     
                     {error && <p className="mt-4 p-3 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg">{error}</p>}
                     
                     <div className="mt-6">
                        <label htmlFor="level" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Conversation Level</label>
                        <select
                            id="level"
                            value={level}
                            onChange={(e) => setLevel(e.target.value as ConversationLevel)}
                            className="mt-1 w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none transition bg-gray-50 dark:bg-gray-700"
                        >
                            <option>Beginner</option>
                            <option>Intermediate</option>
                            <option>Advanced</option>
                        </select>
                     </div>
                     <button onClick={handleStart} className="mt-6 w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                       {status === 'error' || status === 'ended' ? 'Start New Conversation' : 'Start Conversation'}
                     </button>
                </div>
            );
        }

        return (
            <div className="w-full h-full flex flex-col">
                <div className="flex-1 overflow-y-auto p-4 bg-white dark:bg-gray-800 rounded-lg shadow-inner">
                     {transcripts.map((entry, index) => (
                        <div key={index} className={`flex items-start gap-3 my-3 ${entry.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {entry.sender === 'ai' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white"><SparklesIcon className="w-5 h-5"/></div>}
                            <div className={`max-w-lg px-4 py-2 rounded-2xl ${entry.sender === 'user' ? 'bg-blue-100 dark:bg-blue-900/60 text-gray-800 dark:text-gray-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                                <p>{entry.text}</p>
                            </div>
                            {entry.sender === 'user' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center"><UserIcon className="w-5 h-5"/></div>}
                        </div>
                    ))}
                    <div ref={transcriptEndRef} />
                </div>
                <div className="flex-shrink-0 pt-6 flex flex-col items-center">
                     {status === 'connecting' && <div className="flex items-center gap-4"><LoadingSpinner /> <p>Connecting...</p></div>}
                     {status === 'connected' && <div className="w-20 h-20 bg-blue-500 rounded-full animate-pulse flex items-center justify-center text-white"><MicrophoneIcon className="w-8 h-8"/></div>}
                     <button onClick={handleStop} className="mt-6 px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors">
                        End Conversation
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col flex-1 h-full bg-gray-100 dark:bg-gray-900">
            <header className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <h1 className="text-xl font-semibold">Live Speaking Practice</h1>
            </header>
            
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                {renderContent()}
            </div>
        </div>
    );
};

export default LiveChatView;
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { generatePronunciationAudio } from '../services/geminiService';
import { PronunciationIcon, PlayIcon, StopIcon, MicrophoneIcon } from './IconComponents';
import LoadingSpinner from './LoadingSpinner';
import useSpeechRecognition from './useSpeechRecognition';

// Helper function to decode base64 string to Uint8Array
function decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

// Helper function to decode raw PCM audio data into an AudioBuffer
async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}


const PronunciationView: React.FC = () => {
    const [inputText, setInputText] = useState('');
    const [lastPronouncedText, setLastPronouncedText] = useState('');
    const [base64Audio, setBase64Audio] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isAutoplayEnabled, setIsAutoplayEnabled] = useState(true);

    const audioContextRef = useRef<AudioContext | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const { isListening, transcript, startListening, stopListening, hasRecognitionSupport } = useSpeechRecognition({ continuous: true });

    useEffect(() => {
        setInputText(transcript);
    }, [transcript]);

    useEffect(() => {
        // Initialize AudioContext
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        
        // Cleanup on unmount
        return () => {
            audioContextRef.current?.close();
            if (audioSourceRef.current) {
                audioSourceRef.current.stop();
            }
        };
    }, []);

    const stopPlayback = useCallback(() => {
        if (audioSourceRef.current) {
            audioSourceRef.current.stop();
            audioSourceRef.current.disconnect();
            audioSourceRef.current = null;
        }
        setIsPlaying(false);
    }, []);

    const playAudio = useCallback(async (audioDataB64: string) => {
        if (!audioContextRef.current) return;

        stopPlayback(); // Stop any currently playing audio before starting a new one

        setIsPlaying(true);
        try {
            if (audioContextRef.current.state === 'suspended') {
                await audioContextRef.current.resume();
            }
            const audioData = decode(audioDataB64);
            const audioBuffer = await decodeAudioData(audioData, audioContextRef.current, 24000, 1);

            const source = audioContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContextRef.current.destination);
            source.onended = () => {
                setIsPlaying(false);
                audioSourceRef.current = null;
            };
            source.start();
            audioSourceRef.current = source;
        } catch (e) {
            console.error("Error playing audio:", e);
            setError("Could not play the generated audio.");
            setIsPlaying(false);
        }
    }, [stopPlayback]);

    const handlePlayAudio = useCallback(async () => {
        if (isPlaying) {
            stopPlayback();
        } else if (base64Audio) {
            await playAudio(base64Audio);
        }
    }, [isPlaying, stopPlayback, base64Audio, playAudio]);

    const handleSubmit = async () => {
        if (isListening) {
            stopListening();
        }
        if (!inputText.trim()) {
            setError('Please enter some text to pronounce.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setBase64Audio(null);
        stopPlayback();

        try {
            const audioResult = await generatePronunciationAudio(inputText);
            setBase64Audio(audioResult);
            setLastPronouncedText(inputText);
            if (isAutoplayEnabled) {
                await playAudio(audioResult);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col flex-1 h-full bg-gray-100 dark:bg-gray-900">
            <header className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <h1 className="text-xl font-semibold">Pronunciation Practice</h1>
            </header>
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                        <div className="flex justify-between items-center mb-4">
                             <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300">Enter text to hear it spoken</h2>
                             {hasRecognitionSupport && (
                                <button
                                    type="button"
                                    onClick={isListening ? stopListening : startListening}
                                    className={`p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:ring-offset-gray-800 focus:ring-blue-500 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'}`}
                                    aria-label={isListening ? 'Stop listening' : 'Start listening'}
                                >
                                    <MicrophoneIcon className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder={isListening ? "Listening..." : "e.g., The quick brown fox jumps over the lazy dog."}
                            className={`w-full h-32 p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none transition bg-gray-50 dark:bg-gray-700 ${isListening ? 'ring-2 ring-red-500 focus:ring-2 focus:ring-red-500' : 'focus:ring-2 focus:ring-blue-500'}`}
                            disabled={isLoading}
                        />
                        <div className="flex items-center mt-4">
                            <input
                                id="autoplay-checkbox"
                                type="checkbox"
                                checked={isAutoplayEnabled}
                                onChange={(e) => setIsAutoplayEnabled(e.target.checked)}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                            />
                            <label htmlFor="autoplay-checkbox" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                Play audio automatically
                            </label>
                        </div>
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="mt-4 w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            {isLoading ? <LoadingSpinner /> : <><PronunciationIcon /> <span className="ml-2">Pronounce</span></>}
                        </button>
                    </div>

                    {error && (
                        <div className="mt-6 p-4 bg-red-100 dark:bg-red-900/50 border border-red-400 text-red-700 dark:text-red-300 rounded-lg">
                            <strong>Error:</strong> {error}
                        </div>
                    )}

                    {base64Audio && (
                        <div className="mt-6 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                            <p className="text-gray-600 dark:text-gray-400 mb-4 border-l-4 border-gray-200 dark:border-gray-600 pl-4">
                                {lastPronouncedText}
                            </p>
                            <button
                                onClick={handlePlayAudio}
                                className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                                {isPlaying ? <StopIcon /> : <PlayIcon />}
                                <span>{isPlaying ? 'Stop' : 'Play Audio'}</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PronunciationView;
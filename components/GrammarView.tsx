import React, { useState, useRef, useEffect, useCallback } from 'react';
import { correctGrammar, generatePronunciationAudio } from '../services/geminiService';
import { GrammarCorrection } from '../types';
import { GrammarIcon, SparklesIcon, ThumbsUpIcon, ThumbsDownIcon, PlayIcon, StopIcon } from './IconComponents';
import LoadingSpinner from './LoadingSpinner';
import { decode, decodeAudioData } from '../utils/audioUtils';

const GrammarView: React.FC = () => {
    const [inputText, setInputText] = useState('');
    const [result, setResult] = useState<GrammarCorrection | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    const [isAudioLoading, setIsAudioLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

    const [feedbackState, setFeedbackState] = useState<'idle' | 'negative_prompt' | 'submitted'>('idle');
    const [feedbackReason, setFeedbackReason] = useState('');


     useEffect(() => {
        // Initialize AudioContext
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        
        // Cleanup on unmount
        return () => {
            audioSourceRef.current?.stop();
            audioContextRef.current?.close();
        };
    }, []);

    const stopPlayback = useCallback(() => {
        if (audioSourceRef.current) {
            audioSourceRef.current.onended = null;
            audioSourceRef.current.stop();
            audioSourceRef.current = null;
        }
        setIsPlaying(false);
    }, []);

    const playAudio = useCallback(async (textToSpeak: string) => {
        if (!audioContextRef.current) return;
        
        stopPlayback();
        setIsAudioLoading(true);
        setError(null);

        try {
            if (audioContextRef.current.state === 'suspended') {
                await audioContextRef.current.resume();
            }

            const base64Audio = await generatePronunciationAudio(textToSpeak);
            const audioData = decode(base64Audio);
            const audioBuffer = await decodeAudioData(audioData, audioContextRef.current, 24000, 1);
            
            const source = audioContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContextRef.current.destination);
            
            // The order of the following operations is critical to avoid race conditions.
            // 1. Set the onended handler. This ensures that from the moment the source is
            //    "active", its cleanup logic is already attached.
            source.onended = () => {
                 // Only update state if the source that ended is the one we are currently
                 // tracking. This prevents a previous sound's onended event from
                 // incorrectly setting the state.
                 if (audioSourceRef.current === source) {
                    setIsPlaying(false);
                    audioSourceRef.current = null;
                 }
            };

            // 2. Assign the source to the ref, making it the "current" audio source.
            audioSourceRef.current = source;

            // 3. Set the state to playing. This will schedule a re-render.
            setIsPlaying(true);

            // 4. Start the audio. This is the last step.
            source.start();

        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "Could not play audio.";
            setError(`Audio Error: ${errorMessage}`);
            console.error("Error playing audio:", e);
            // Ensure cleanup on error
            audioSourceRef.current = null;
            setIsPlaying(false);
        } finally {
            setIsAudioLoading(false);
        }
    }, [stopPlayback]);
    
    const handleAudioButtonClick = useCallback(() => {
        if (isPlaying) {
            stopPlayback();
        } else if (result?.correction) {
            playAudio(result.correction);
        }
    }, [isPlaying, result, stopPlayback, playAudio]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim()) {
            setError('Please enter some text to check.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setResult(null);
        stopPlayback();
        setFeedbackState('idle');
        setFeedbackReason('');

        try {
            const correctionResult = await correctGrammar(inputText);
            setResult(correctionResult);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFeedback = (rating: 'positive' | 'negative') => {
        if (rating === 'positive') {
            console.log({
                feedback: 'positive',
                originalText: inputText,
                correction: result?.correction
            });
            setFeedbackState('submitted');
        } else {
            setFeedbackState('negative_prompt');
        }
    };
    
    const submitNegativeFeedback = () => {
        console.log({
            feedback: 'negative',
            reason: feedbackReason,
            originalText: inputText,
            correction: result?.correction,
            explanation_en: result?.explanation_en,
            explanation_vi: result?.explanation_vi,
        });
        setFeedbackState('submitted');
    };

    return (
        <div className="flex flex-col flex-1 h-full bg-gray-100 dark:bg-gray-900">
            <header className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <h1 className="text-xl font-semibold">Grammar Check / Kiểm tra Ngữ pháp</h1>
            </header>
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                        <form onSubmit={handleSubmit}>
                            <h2 className="text-lg font-medium mb-4 text-gray-700 dark:text-gray-300">Enter text to check / Nhập văn bản để kiểm tra</h2>
                            <textarea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="e.g., He don't like apple."
                                className="w-full h-32 p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition bg-gray-50 dark:bg-gray-700"
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="mt-4 w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                {isLoading ? <LoadingSpinner /> : <><SparklesIcon /> <span className="ml-2">Check Grammar</span></>}
                            </button>
                        </form>
                    </div>

                    {error && (
                        <div className="mt-6 p-4 bg-red-100 dark:bg-red-900/50 border border-red-400 text-red-700 dark:text-red-300 rounded-lg">
                            <strong>Error:</strong> {error}
                        </div>
                    )}

                    {result && (
                        <div className="mt-8 space-y-4">
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                                <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400">Original Text / Văn bản gốc</h3>
                                <p className="mt-2 text-gray-700 dark:text-gray-300 italic line-through">
                                    {inputText}
                                </p>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/50 p-6 rounded-xl shadow-lg border border-green-200 dark:border-green-700">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="flex-shrink-0 w-6 h-6 text-green-600 dark:text-green-400"><ThumbsUpIcon/></span>
                                        <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">Correction / Chỉnh sửa</h3>
                                    </div>
                                    <button
                                        onClick={handleAudioButtonClick}
                                        disabled={isAudioLoading}
                                        className="flex items-center justify-center w-10 h-10 rounded-full text-green-700 dark:text-green-300 bg-green-200 dark:bg-green-800/50 hover:bg-green-300 dark:hover:bg-green-700/50 transition-colors disabled:opacity-50 disabled:cursor-wait focus:outline-none focus:ring-2 focus:ring-offset-2 dark:ring-offset-green-900/50 focus:ring-green-500"
                                        aria-label={isPlaying ? "Stop audio" : "Play correction"}
                                    >
                                        {isAudioLoading ? <LoadingSpinner /> : (isPlaying ? <StopIcon className="w-5 h-5"/> : <PlayIcon className="w-5 h-5"/>)}
                                    </button>
                                </div>
                                <p className="mt-2 text-xl font-medium text-green-900 dark:text-green-100">
                                    {result.correction}
                                </p>
                            </div>
                             <div className="bg-blue-50 dark:bg-blue-900/50 p-6 rounded-xl shadow-lg border border-blue-200 dark:border-blue-700">
                                <div className="flex items-center gap-2">
                                     <span className="flex-shrink-0 w-6 h-6 text-blue-600 dark:text-blue-400"><GrammarIcon/></span>
                                    <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">Explanation / Giải thích</h3>
                                </div>
                                <p className="mt-3 text-gray-700 dark:text-gray-300">
                                    {result.explanation_en}
                                </p>
                                <p className="mt-2 text-gray-500 dark:text-gray-400 italic">
                                    {result.explanation_vi}
                                </p>
                            </div>
                            <div className="mt-6 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                                {feedbackState === 'idle' && (
                                    <>
                                        <h4 className="text-center font-medium text-gray-700 dark:text-gray-300">Was this correction helpful?</h4>
                                        <div className="mt-4 flex justify-center gap-4">
                                            <button onClick={() => handleFeedback('positive')} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-green-100 dark:hover:bg-green-900/50 text-green-600 transition-colors">
                                                <ThumbsUpIcon />
                                                <span>Yes</span>
                                            </button>
                                            <button onClick={() => handleFeedback('negative')} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 transition-colors">
                                                <ThumbsDownIcon />
                                                <span>No</span>
                                            </button>
                                        </div>
                                    </>
                                )}
                                {feedbackState === 'negative_prompt' && (
                                    <div>
                                        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">We're sorry to hear that. What could be improved?</h4>
                                        <textarea
                                            value={feedbackReason}
                                            onChange={(e) => setFeedbackReason(e.target.value)}
                                            placeholder="e.g., The explanation was unclear, the correction was wrong..."
                                            className="w-full h-24 p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition bg-gray-50 dark:bg-gray-700"
                                        />
                                        <button onClick={submitNegativeFeedback} className="mt-2 w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                                            Submit Feedback
                                        </button>
                                    </div>
                                )}
                                {feedbackState === 'submitted' && (
                                    <p className="text-center text-green-600 dark:text-green-400 font-medium">
                                        Thank you for your feedback!
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GrammarView;

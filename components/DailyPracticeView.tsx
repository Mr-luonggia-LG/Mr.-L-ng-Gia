import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DailyPracticeDay, DailyPracticeContent, VocabularyItem, Exercise } from '../types';
import { generateDailyPractice, generatePronunciationAudio } from '../services/geminiService';
import useSpeechRecognition from './useSpeechRecognition';
import LoadingSpinner from './LoadingSpinner';
import { PlayIcon, StopIcon, MicrophoneIcon } from './IconComponents';
import { decode, decodeAudioData } from '../utils/audioUtils';

const DAILY_PRACTICE_STORAGE_KEY = 'lg-assistant-daily-practice';
const TOTAL_DAYS = 30;

const GrammarExercise: React.FC<{ exercise: Exercise; onAnswer: (answer: string) => void; isCompleted: boolean; savedAnswer?: string }> = ({ exercise, onAnswer, isCompleted, savedAnswer }) => {
    const [selectedOption, setSelectedOption] = useState<string | null>(savedAnswer || null);
    const isSubmitted = isCompleted || !!savedAnswer;
    const isCorrect = selectedOption?.trim().toLowerCase() === exercise.answer.trim().toLowerCase();

    useEffect(() => {
        if (savedAnswer) {
            setSelectedOption(savedAnswer);
        }
    }, [savedAnswer]);

    const handleOptionChange = (value: string) => {
        if (!isSubmitted) {
            setSelectedOption(value);
            onAnswer(value);
        }
    };
    
    const getOptionClasses = (option: string) => {
        if (!isSubmitted) return 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700';
        if (option === exercise.answer) return 'border-green-500 bg-green-100 dark:bg-green-900/50';
        if (option === selectedOption && option !== exercise.answer) return 'border-red-500 bg-red-100 dark:bg-red-900/50';
        return 'border-gray-300 dark:border-gray-600';
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Grammar Challenge</h3>
            <p className="font-medium text-gray-700 dark:text-gray-300 mb-4">{exercise.question.replace('___', '______')}</p>
            {exercise.type === 'multiple_choice' && exercise.options && (
                <div className="space-y-3">
                    {exercise.options.map((option, i) => (
                        <label key={i} className={`flex items-center p-3 border-2 rounded-lg transition-colors ${isSubmitted ? '' : 'cursor-pointer'} ${getOptionClasses(option)}`}>
                            <input
                                type="radio"
                                name={`exercise-${exercise.question}`}
                                value={option}
                                checked={selectedOption === option}
                                onChange={(e) => handleOptionChange(e.target.value)}
                                disabled={isSubmitted}
                                className="w-4 h-4 text-blue-600"
                            />
                            <span className="ml-3 text-gray-700 dark:text-gray-300">{option}</span>
                        </label>
                    ))}
                </div>
            )}
            {isSubmitted && (
                <div className={`mt-4 p-3 rounded-lg text-sm ${isCorrect ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200'}`}>
                    <p className="font-bold">
                        {isCorrect ? 'Correct!' : `Incorrect. The correct answer is: ${exercise.answer}`}
                    </p>
                    <p className="mt-1">{exercise.explanation}</p>
                </div>
            )}
        </div>
    );
};


const DayPracticeScreen: React.FC<{ day: DailyPracticeDay; onBack: () => void; onComplete: (dayNumber: number, answers: any) => void }> = ({ day, onBack, onComplete }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [content, setContent] = useState<DailyPracticeContent | undefined>(day.content);
    const [grammarAnswer, setGrammarAnswer] = useState<string | undefined>(day.answers?.grammar);
    
    const [isAudioLoading, setIsAudioLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const { isListening, transcript, startListening, stopListening } = useSpeechRecognition();

    useEffect(() => {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        return () => { audioContextRef.current?.close(); };
    }, []);

    const stopPlayback = useCallback(() => {
        if (audioSourceRef.current) {
            audioSourceRef.current.stop();
            audioSourceRef.current = null;
        }
        setIsPlaying(false);
    }, []);
    
    const playAudio = useCallback(async (text: string) => {
        stopPlayback();
        if (!audioContextRef.current) return;
        setIsAudioLoading(true);
        try {
            const base64Audio = await generatePronunciationAudio(text);
            const audioData = decode(base64Audio);
            const audioBuffer = await decodeAudioData(audioData, audioContextRef.current, 24000, 1);
            const source = audioContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContextRef.current.destination);
            source.onended = () => setIsPlaying(false);
            source.start();
            audioSourceRef.current = source;
            setIsPlaying(true);
        } catch (e) {
            console.error(e);
            setError('Failed to play audio.');
        } finally {
            setIsAudioLoading(false);
        }
    }, [stopPlayback]);

    useEffect(() => {
        const fetchContent = async () => {
            if (!content) {
                setIsLoading(true);
                setError(null);
                try {
                    const level = day.day <= 10 ? 'Beginner' : day.day <= 20 ? 'Intermediate' : 'Advanced';
                    const newContent = await generateDailyPractice(day.day, level);
                    setContent(newContent);
                } catch (err) {
                    setError(err instanceof Error ? err.message : "Could not load today's practice.");
                } finally {
                    setIsLoading(false);
                }
            }
        };
        fetchContent();
    }, [day, content]);

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><LoadingSpinner /> <p className="ml-4">Loading Day {day.day}...</p></div>;
    }

    if (error) {
        return <div className="p-6 text-center text-red-500">{error}</div>;
    }

    if (!content) {
        return <div className="p-6 text-center">No content available.</div>;
    }

    const isPracticeCompleted = day.status === 'completed' || (!!grammarAnswer);

    return (
        <div className="p-6 md:p-8">
            <button onClick={onBack} className="mb-6 text-blue-600 dark:text-blue-400 hover:underline">
                &larr; Back to Calendar
            </button>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6">Day {day.day} Practice</h2>
            <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                    <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Vocabulary Focus</h3>
                    <div className="space-y-4">
                        {content.vocabulary.map((item, index) => (
                            <div key={index}>
                                <p className="font-semibold text-gray-900 dark:text-white">{item.word} <span className="text-sm font-normal text-gray-500 dark:text-gray-400 italic">({item.pos})</span></p>
                                <p className="text-gray-700 dark:text-gray-300">{item.definition}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 italic">e.g., "{item.example}"</p>
                            </div>
                        ))}
                    </div>
                </div>

                <GrammarExercise exercise={content.grammar} onAnswer={setGrammarAnswer} isCompleted={day.status === 'completed'} savedAnswer={day.answers?.grammar}/>
                
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                    <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Pronunciation Practice</h3>
                    <p className="text-lg text-gray-700 dark:text-gray-300 italic mb-4">"{content.pronunciation}"</p>
                     <div className="flex flex-wrap gap-4 items-center">
                        <button onClick={() => isPlaying ? stopPlayback() : playAudio(content.pronunciation)} disabled={isAudioLoading} className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
                             {isAudioLoading ? <LoadingSpinner/> : (isPlaying ? <StopIcon className="w-5 h-5"/> : <PlayIcon className="w-5 h-5"/>)}
                             {isPlaying ? 'Stop' : 'Listen'}
                        </button>
                         <button onClick={isListening ? stopListening : startListening} className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg ${isListening ? 'bg-red-500 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>
                             <MicrophoneIcon className="w-5 h-5"/>
                             {isListening ? 'Stop Listening' : 'Practice Speaking'}
                        </button>
                    </div>
                    {transcript && <p className="mt-4 text-gray-600 dark:text-gray-400">You said: <span className="italic">"{transcript}"</span></p>}
                </div>

                {day.status !== 'completed' && (
                    <button onClick={() => onComplete(day.day, { grammar: grammarAnswer })} disabled={!isPracticeCompleted} className="w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors">
                        Complete Day {day.day}
                    </button>
                )}
            </div>
        </div>
    );
};


const DailyPracticeView: React.FC = () => {
    const [days, setDays] = useState<DailyPracticeDay[]>([]);
    const [selectedDay, setSelectedDay] = useState<DailyPracticeDay | null>(null);
    
    useEffect(() => {
        try {
            const savedData = localStorage.getItem(DAILY_PRACTICE_STORAGE_KEY);
            if (savedData) {
                setDays(JSON.parse(savedData));
            } else {
                const initialDays = Array.from({ length: TOTAL_DAYS }, (_, i) => ({
                    day: i + 1,
                    status: i === 0 ? 'unlocked' : 'locked',
                } as DailyPracticeDay));
                setDays(initialDays);
                localStorage.setItem(DAILY_PRACTICE_STORAGE_KEY, JSON.stringify(initialDays));
            }
        } catch (error) {
            console.error("Failed to load or initialize daily practice data:", error);
        }
    }, []);

    const handleSelectDay = (day: DailyPracticeDay) => {
        if (day.status !== 'locked') {
            setSelectedDay(day);
        }
    };

    const handleCompleteDay = (dayNumber: number, answers: any) => {
        const updatedDays = days.map(d => {
            if (d.day === dayNumber) {
                return { ...d, status: 'completed', answers, content: selectedDay?.content };
            }
            if (d.day === dayNumber + 1 && d.status === 'locked') {
                return { ...d, status: 'unlocked' };
            }
            return d;
        });
        setDays(updatedDays);
        localStorage.setItem(DAILY_PRACTICE_STORAGE_KEY, JSON.stringify(updatedDays));
        setSelectedDay(null); // Go back to calendar
    };
    
    const getDayCardClasses = (status: DailyPracticeDay['status']) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 dark:bg-green-900/50 border-green-400 dark:border-green-700 text-green-800 dark:text-green-200 cursor-pointer hover:bg-green-200 dark:hover:bg-green-800/50';
            case 'unlocked':
                return 'bg-blue-100 dark:bg-blue-900/50 border-blue-400 dark:border-blue-700 text-blue-800 dark:text-blue-200 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800/50 animate-pulse';
            case 'locked':
                return 'bg-gray-200 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed';
        }
    };

    return (
        <div className="flex flex-col flex-1 h-full bg-gray-100 dark:bg-gray-900">
            <header className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <h1 className="text-xl font-semibold">Daily Practice Challenge</h1>
            </header>
            <div className="flex-1 overflow-y-auto">
                {selectedDay ? (
                    <DayPracticeScreen day={selectedDay} onBack={() => setSelectedDay(null)} onComplete={handleCompleteDay} />
                ) : (
                    <div className="p-6 md:p-8">
                        <div className="max-w-4xl mx-auto">
                            <p className="text-center text-gray-600 dark:text-gray-400 mb-6">Complete each day's practice to unlock the next. Keep your streak going!</p>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                                {days.map(day => (
                                    <div
                                        key={day.day}
                                        onClick={() => handleSelectDay(day)}
                                        className={`flex flex-col items-center justify-center p-4 h-24 rounded-lg border-2 text-center transition-colors ${getDayCardClasses(day.status)}`}
                                    >
                                        <span className="text-2xl font-bold">{day.day}</span>
                                        <span className="text-xs font-semibold uppercase">{day.status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DailyPracticeView;

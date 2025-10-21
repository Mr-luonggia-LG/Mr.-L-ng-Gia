import React, { useState } from 'react';
import { generateExercises } from '../services/geminiService';
import { Exercise, ExerciseSet } from '../types';
import { SparklesIcon } from './IconComponents';
import LoadingSpinner from './LoadingSpinner';

const ExerciseCard: React.FC<{ exercise: Exercise; index: number }> = ({ exercise, index }) => {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const isCorrect = selectedOption?.trim().toLowerCase() === exercise.answer.trim().toLowerCase();

    const handleOptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isSubmitted) {
            setSelectedOption(e.target.value);
        }
    };

    const handleSubmit = () => {
        if (selectedOption) {
            setIsSubmitted(true);
        }
    };

    const getOptionClasses = (option: string) => {
        if (!isSubmitted) return 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700';
        if (option === exercise.answer) return 'border-green-500 bg-green-100 dark:bg-green-900/50';
        if (option === selectedOption && option !== exercise.answer) return 'border-red-500 bg-red-100 dark:bg-red-900/50';
        return 'border-gray-300 dark:border-gray-600';
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <p className="font-semibold text-gray-800 dark:text-gray-200 mb-4">{index + 1}. {exercise.question.replace('___', '______')}</p>
            
            {exercise.type === 'multiple_choice' && exercise.options && (
                <div className="space-y-3">
                    {exercise.options.map((option, i) => (
                        <label key={i} className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${getOptionClasses(option)}`}>
                            <input
                                type="radio"
                                name={`exercise-${index}`}
                                value={option}
                                checked={selectedOption === option}
                                onChange={handleOptionChange}
                                disabled={isSubmitted}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                            />
                            <span className="ml-3 text-gray-700 dark:text-gray-300">{option}</span>
                        </label>
                    ))}
                </div>
            )}
            
            {exercise.type === 'fill_in_the_blank' && (
                <input
                    type="text"
                    onChange={(e) => setSelectedOption(e.target.value)}
                    disabled={isSubmitted}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none transition bg-gray-50 dark:bg-gray-700"
                />
            )}

            {!isSubmitted ? (
                 <button
                    onClick={handleSubmit}
                    disabled={!selectedOption}
                    className="mt-4 w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                    Check Answer
                </button>
            ) : (
                <div className={`mt-4 p-4 rounded-lg text-sm ${isCorrect ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200'}`}>
                    <p className="font-bold">
                        {isCorrect ? 'Correct!' : `Incorrect. The correct answer is: ${exercise.answer}`}
                    </p>
                    <p className="mt-1">{exercise.explanation}</p>
                </div>
            )}
        </div>
    );
};


const ExercisesView: React.FC = () => {
    const [topic, setTopic] = useState('');
    const [level, setLevel] = useState('Intermediate');
    const [exerciseSet, setExerciseSet] = useState<ExerciseSet | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic.trim()) {
            setError('Please enter a topic.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setExerciseSet(null);

        try {
            const result = await generateExercises(topic, level, 5); // Generate 5 exercises
            setExerciseSet(result);
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
                <h1 className="text-xl font-semibold">Practice Exercises</h1>
            </header>
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                        <form onSubmit={handleSubmit}>
                            <h2 className="text-lg font-medium mb-4 text-gray-700 dark:text-gray-300">Generate exercises for a topic</h2>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                 <div className="md:col-span-2">
                                     <label htmlFor="topic" className="block text-sm font-medium text-gray-600 dark:text-gray-400">Topic</label>
                                     <input
                                        id="topic"
                                        type="text"
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        placeholder="e.g., Phrasal Verbs with 'get'"
                                        className="mt-1 w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none transition bg-gray-50 dark:bg-gray-700"
                                        disabled={isLoading}
                                    />
                                 </div>
                                 <div>
                                      <label htmlFor="level" className="block text-sm font-medium text-gray-600 dark:text-gray-400">Level</label>
                                      <select
                                        id="level"
                                        value={level}
                                        onChange={(e) => setLevel(e.target.value)}
                                        className="mt-1 w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none transition bg-gray-50 dark:bg-gray-700"
                                        disabled={isLoading}
                                    >
                                        <option>Beginner</option>
                                        <option>Intermediate</option>
                                        <option>Advanced</option>
                                    </select>
                                 </div>
                             </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="mt-4 w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                {isLoading ? <LoadingSpinner /> : <><SparklesIcon /> <span className="ml-2">Generate Exercises</span></>}
                            </button>
                        </form>
                    </div>

                    {error && (
                        <div className="mt-6 p-4 bg-red-100 dark:bg-red-900/50 border border-red-400 text-red-700 dark:text-red-300 rounded-lg">
                            <strong>Error:</strong> {error}
                        </div>
                    )}

                    {exerciseSet && (
                        <div className="mt-8 space-y-4">
                             <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Exercises: <span className="text-blue-600 dark:text-blue-400 capitalize">{exerciseSet.topic}</span></h2>
                             {exerciseSet.exercises.map((ex, index) => (
                                 <ExerciseCard key={index} exercise={ex} index={index} />
                             ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExercisesView;

import React, { useState } from 'react';
import { generateLessonPlan } from '../services/geminiService';
import { LessonPlan, LessonPlanActivity } from '../types';
import { SparklesIcon } from './IconComponents';
import LoadingSpinner from './LoadingSpinner';

const ReadOnlyActivityCard: React.FC<{
    title: string;
    activityData: LessonPlanActivity;
    color: string;
}> = ({ title, activityData, color }) => (
    <div className={`p-4 border-l-4 ${color} bg-gray-50 dark:bg-gray-800/50 rounded-r-lg`}>
        <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200">{title}</h4>
            <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded-md bg-white dark:bg-gray-700 text-sm font-medium">{activityData.duration}</span>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">mins</span>
            </div>
        </div>
         <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{activityData.activity}</p>
    </div>
);


const LessonPlanView: React.FC = () => {
    const [topic, setTopic] = useState('');
    const [level, setLevel] = useState('Intermediate');
    const [duration, setDuration] = useState('45');
    const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic.trim() || !level || !duration) {
            setError('Please fill in all fields.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setLessonPlan(null);

        try {
            const result = await generateLessonPlan(topic, level, parseInt(duration, 10));
            setLessonPlan(result);
        } catch (err)
 {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="flex flex-col flex-1 h-full bg-gray-100 dark:bg-gray-900">
            <header className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <h1 className="text-xl font-semibold">Lesson Plan Generator</h1>
            </header>
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                <div className="max-w-4xl mx-auto">
                    {/* Input Form */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                        <form onSubmit={handleSubmit}>
                            <h2 className="text-lg font-medium mb-4 text-gray-700 dark:text-gray-300">Create a new lesson plan</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-3">
                                    <label htmlFor="topic" className="block text-sm font-medium text-gray-600 dark:text-gray-400">Topic</label>
                                    <input
                                        id="topic"
                                        type="text"
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        placeholder="e.g., Present Perfect vs. Past Simple"
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
                                <div>
                                    <label htmlFor="duration" className="block text-sm font-medium text-gray-600 dark:text-gray-400">Duration (minutes)</label>
                                     <input
                                        id="duration"
                                        type="number"
                                        value={duration}
                                        onChange={(e) => setDuration(e.target.value)}
                                        placeholder="e.g., 45"
                                        className="mt-1 w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none transition bg-gray-50 dark:bg-gray-700"
                                        disabled={isLoading}
                                        min="1"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="mt-6 w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                {isLoading ? <LoadingSpinner /> : <><SparklesIcon /> <span className="ml-2">Generate Plan</span></>}
                            </button>
                        </form>
                    </div>

                    {error && (
                        <div className="mt-6 p-4 bg-red-100 dark:bg-red-900/50 border border-red-400 text-red-700 dark:text-red-300 rounded-lg">
                            <strong>Error:</strong> {error}
                        </div>
                    )}

                    {/* Lesson Plan Display */}
                    {lessonPlan && (
                        <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                            <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
                                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 capitalize">{lessonPlan.topic}</h2>
                                <div className="mt-2 flex items-center gap-6 text-md text-gray-500 dark:text-gray-400">
                                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded-full font-medium">{lessonPlan.level}</span>
                                    <span className="font-medium">{lessonPlan.totalDuration} minutes</span>
                                </div>
                            </div>
                            
                            <div className="space-y-6">
                                {/* Objectives */}
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Objectives</h3>
                                    <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 pl-2">
                                        {lessonPlan.objectives.map((obj, i) => <li key={i}>{obj}</li>)}
                                    </ul>
                                </div>

                                {/* Activities */}
                                <div className="space-y-4">
                                     <ReadOnlyActivityCard title="Warm-up" activityData={lessonPlan.warmUp} color="border-yellow-400 dark:border-yellow-600" />
                                     <ReadOnlyActivityCard title="Presentation" activityData={lessonPlan.presentation} color="border-blue-400 dark:border-blue-600" />
                                     <ReadOnlyActivityCard title="Practice" activityData={lessonPlan.practice} color="border-green-400 dark:border-green-600" />
                                     <ReadOnlyActivityCard title="Production" activityData={lessonPlan.production} color="border-purple-400 dark:border-purple-600" />
                                </div>
                                
                                {/* Homework */}
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Homework</h3>
                                    <p className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{lessonPlan.homework}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LessonPlanView;
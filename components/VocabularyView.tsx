
import React, { useState } from 'react';
import { generateVocabulary } from '../services/geminiService';
import { VocabularyItem } from '../types';
import { VocabularyIcon, SparklesIcon } from './IconComponents';
import LoadingSpinner from './LoadingSpinner';

const VocabularyView: React.FC = () => {
    const [topic, setTopic] = useState('');
    const [vocabularyList, setVocabularyList] = useState<VocabularyItem[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic.trim()) {
            setError('Please enter a topic.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setVocabularyList([]);

        try {
            const result = await generateVocabulary(topic);
            setVocabularyList(result);
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
                <h1 className="text-xl font-semibold">Vocabulary Builder</h1>
            </header>
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                        <form onSubmit={handleSubmit}>
                            <h2 className="text-lg font-medium mb-4 text-gray-700 dark:text-gray-300">Enter a topic to learn about</h2>
                            <div className="flex gap-4">
                                <input
                                    type="text"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="e.g., Technology, Travel, Cooking"
                                    className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none transition bg-gray-50 dark:bg-gray-700"
                                    disabled={isLoading}
                                />
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    {isLoading ? <LoadingSpinner /> : <><SparklesIcon /> <span className="ml-2">Generate</span></>}
                                </button>
                            </div>
                        </form>
                    </div>

                    {error && (
                        <div className="mt-6 p-4 bg-red-100 dark:bg-red-900/50 border border-red-400 text-red-700 dark:text-red-300 rounded-lg">
                            <strong>Error:</strong> {error}
                        </div>
                    )}

                    {vocabularyList.length > 0 && (
                        <div className="mt-8 space-y-4">
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Vocabulary for: <span className="text-blue-600 dark:text-blue-400 capitalize">{topic}</span></h2>
                            {vocabularyList.map((item, index) => (
                                <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                                    <div className="flex items-baseline">
                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{item.word}</h3>
                                        <p className="ml-3 text-sm font-medium text-gray-500 dark:text-gray-400 italic">({item.pos})</p>
                                    </div>
                                    <p className="mt-2 text-gray-700 dark:text-gray-300">{item.definition}</p>
                                    <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 italic border-l-4 border-blue-300 dark:border-blue-700 pl-3">
                                        "{item.example}"
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VocabularyView;

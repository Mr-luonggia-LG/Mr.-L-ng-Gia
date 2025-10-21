import React, { useState } from 'react';
import { generateIdioms } from '../services/geminiService';
import { IdiomItem } from '../types';
import { IdiomIcon, SparklesIcon } from './IconComponents';
import LoadingSpinner from './LoadingSpinner';

const IdiomsView: React.FC = () => {
    const [topic, setTopic] = useState('');
    const [idiomList, setIdiomList] = useState<IdiomItem[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic.trim()) {
            setError('Please enter a topic to generate idioms.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setIdiomList([]);

        try {
            const result = await generateIdioms(topic);
            setIdiomList(result);
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
                <h1 className="text-xl font-semibold">Idioms Explorer / Khám phá Thành ngữ</h1>
            </header>
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                        <form onSubmit={handleSubmit}>
                            <h2 className="text-lg font-medium mb-4 text-gray-700 dark:text-gray-300">Enter a topic to learn idioms about / Nhập chủ đề để học thành ngữ</h2>
                            <div className="flex gap-4">
                                <input
                                    type="text"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="e.g., Love, Success, Money"
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

                    {idiomList.length > 0 && (
                        <div className="mt-8 space-y-4">
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Idioms for: <span className="text-blue-600 dark:text-blue-400 capitalize">{topic}</span></h2>
                            {idiomList.map((item, index) => (
                                <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                                    <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-400">{item.idiom}</h3>
                                    <div className="mt-4 space-y-3">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Meaning / Ý nghĩa:</p>
                                            <p className="text-gray-700 dark:text-gray-300">{item.meaning}</p>
                                        </div>
                                        <div>
                                             <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Example / Ví dụ:</p>
                                             <p className="text-gray-700 dark:text-gray-300 italic">"{item.example}"</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Vietnamese Equivalent / Tương đương tiếng Việt:</p>
                                            <p className="text-gray-700 dark:text-gray-300">{item.vietnamese_equivalent}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default IdiomsView;
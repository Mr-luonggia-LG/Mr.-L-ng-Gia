import React, { useState } from 'react';
import { gatherKnowledge } from '../services/geminiService';
import { KnowledgeResult } from '../types';
import { SparklesIcon, KnowledgeHubIcon } from './IconComponents';
import LoadingSpinner from './LoadingSpinner';
import MarkdownRenderer from './MarkdownRenderer';

const KnowledgeHubView: React.FC = () => {
    const [topic, setTopic] = useState('');
    const [result, setResult] = useState<KnowledgeResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic.trim()) {
            setError('Please enter a topic to research.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const knowledgeResult = await gatherKnowledge(topic);
            setResult(knowledgeResult);
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
                <h1 className="text-xl font-semibold">Knowledge Hub / Trung tâm Tri thức</h1>
            </header>
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                        <form onSubmit={handleSubmit}>
                            <h2 className="text-lg font-medium mb-4 text-gray-700 dark:text-gray-300">Research any topic / Nghiên cứu chủ đề bất kỳ</h2>
                            <div className="flex gap-4">
                                <input
                                    type="text"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="e.g., The history of the English language"
                                    className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none transition bg-gray-50 dark:bg-gray-700"
                                    disabled={isLoading}
                                />
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    {isLoading ? <LoadingSpinner /> : <><SparklesIcon /> <span className="ml-2">Research</span></>}
                                </button>
                            </div>
                        </form>
                    </div>

                    {isLoading && (
                         <div className="mt-8 text-center flex items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            <span className="ml-4 text-lg text-gray-600 dark:text-gray-400">Gathering information from the web...</span>
                        </div>
                    )}

                    {error && (
                        <div className="mt-6 p-4 bg-red-100 dark:bg-red-900/50 border border-red-400 text-red-700 dark:text-red-300 rounded-lg">
                            <strong>Error:</strong> {error}
                        </div>
                    )}

                    {result ? (
                        <div className="mt-8 bg-white dark:bg-gray-800 p-6 md:p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6 border-b-2 pb-4 border-gray-200 dark:border-gray-700 capitalize">{topic}</h2>
                            <div className="text-gray-700 dark:text-gray-300 leading-relaxed prose dark:prose-invert max-w-none">
                                <MarkdownRenderer text={result.summary} />
                            </div>

                            {result.sources.length > 0 && (
                                <div className="mt-10 border-t pt-6 border-gray-200 dark:border-gray-700">
                                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">Sources / Nguồn tham khảo</h3>
                                    <ul className="space-y-3">
                                        {result.sources.map((source, index) => (
                                            <li key={index} className="flex items-start">
                                                <span className="mr-3 mt-1 text-blue-500 flex-shrink-0">🔗</span>
                                                <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline break-all">
                                                    {source.title || source.uri}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ) : (
                       !isLoading && !error && (
                            <div className="mt-8 text-center p-10 bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
                                <KnowledgeHubIcon className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500" />
                                <h3 className="mt-4 text-xl font-semibold text-gray-700 dark:text-gray-300">Unlock a World of Knowledge</h3>
                                <p className="mt-2 text-gray-500 dark:text-gray-400">Enter a topic above to get a comprehensive summary with cited sources, powered by Google Search.</p>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default KnowledgeHubView;

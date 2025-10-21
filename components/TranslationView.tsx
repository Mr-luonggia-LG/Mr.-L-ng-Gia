import React, { useState, useCallback } from 'react';
import { translateText } from '../services/geminiService';
import { SwapIcon, SparklesIcon } from './IconComponents';
import LoadingSpinner from './LoadingSpinner';

type Language = 'Vietnamese' | 'English';

const TranslationView: React.FC = () => {
    const [sourceText, setSourceText] = useState('');
    const [translatedText, setTranslatedText] = useState('');
    const [sourceLang, setSourceLang] = useState<Language>('Vietnamese');
    const [targetLang, setTargetLang] = useState<Language>('English');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSwapLanguages = useCallback(() => {
        setSourceLang(targetLang);
        setTargetLang(sourceLang);
        // Also swap the text
        setSourceText(translatedText);
        setTranslatedText(sourceText);
    }, [sourceLang, targetLang, sourceText, translatedText]);

    const handleSubmit = async () => {
        if (!sourceText.trim()) {
            setError('Please enter some text to translate.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setTranslatedText('');

        try {
            const result = await translateText(sourceText, sourceLang, targetLang);
            setTranslatedText(result);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unknown error occurred during translation.';
            setError(message);
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="flex flex-col flex-1 h-full bg-gray-100 dark:bg-gray-900">
            <header className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <h1 className="text-xl font-semibold">Bilingual Translation</h1>
            </header>
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="relative grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        {/* Source Text Area */}
                        <div className="flex flex-col bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                            <h2 className="text-lg font-medium mb-4 text-gray-700 dark:text-gray-300">{sourceLang}</h2>
                            <textarea
                                value={sourceText}
                                onChange={(e) => setSourceText(e.target.value)}
                                placeholder={`Enter text in ${sourceLang}...`}
                                className="w-full flex-1 h-48 p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition bg-gray-50 dark:bg-gray-700"
                                disabled={isLoading}
                            />
                        </div>

                         {/* Swap Button - positioned between the two cards on medium+ screens */}
                        <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 items-center justify-center">
                            <button
                                onClick={handleSwapLanguages}
                                className="z-10 w-12 h-12 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-2 border-white dark:border-gray-800 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:ring-offset-gray-900 focus:ring-blue-500"
                                aria-label="Swap languages"
                                >
                                <SwapIcon className="w-6 h-6" />
                            </button>
                        </div>


                        {/* Translated Text Area */}
                        <div className="flex flex-col bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                             <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300">{targetLang}</h2>
                                 {/* Swap button for mobile view */}
                                <button
                                    onClick={handleSwapLanguages}
                                    className="md:hidden p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                    aria-label="Swap languages"
                                >
                                    <SwapIcon className="w-5 h-5" />
                                </button>
                            </div>
                            <textarea
                                value={translatedText}
                                readOnly
                                placeholder="Translation will appear here..."
                                className="w-full flex-1 h-48 p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none bg-gray-100 dark:bg-gray-700/50"
                            />
                        </div>
                    </div>

                    <div className="mt-6">
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            {isLoading ? <LoadingSpinner /> : <><SparklesIcon /> <span className="ml-2">Translate</span></>}
                        </button>
                    </div>

                    {error && (
                        <div className="mt-6 p-4 bg-red-100 dark:bg-red-900/50 border border-red-400 text-red-700 dark:text-red-300 rounded-lg">
                            <strong>Error:</strong> {error}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TranslationView;

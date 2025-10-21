import React, { useState } from 'react';
import { TENSES_DATA } from '../data/tensesData';
import { TenseItem } from '../types';

const TenseCard: React.FC<{ tense: TenseItem; isOpen: boolean; onToggle: () => void }> = ({ tense, isOpen, onToggle }) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full text-left p-6 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                aria-expanded={isOpen}
            >
                <div>
                    <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-400">{tense.name_en}</h3>
                    <p className="text-md text-gray-500 dark:text-gray-400">{tense.name_vi}</p>
                </div>
                <svg
                    className={`w-6 h-6 text-gray-500 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && (
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                    {/* Structure */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <h4 className="font-semibold text-gray-700 dark:text-gray-300">Active Voice (Chủ động)</h4>
                            <p className="mt-1 p-2 bg-gray-100 dark:bg-gray-700 rounded-md font-mono text-sm text-green-700 dark:text-green-300">{tense.structure_active}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-700 dark:text-gray-300">Passive Voice (Bị động)</h4>
                            <p className="mt-1 p-2 bg-gray-100 dark:bg-gray-700 rounded-md font-mono text-sm text-purple-700 dark:text-purple-300">{tense.structure_passive}</p>
                        </div>
                    </div>

                    {/* Usage */}
                    <div className="mb-4">
                         <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Usage (Cách dùng)</h4>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                            <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
                                {tense.usage_en.map((use, i) => <li key={`en-${i}`}>{use}</li>)}
                            </ul>
                             <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400 mt-2 md:mt-0">
                                {tense.usage_vi.map((use, i) => <li key={`vi-${i}`}>{use}</li>)}
                            </ul>
                         </div>
                    </div>

                     {/* Examples */}
                    <div>
                        <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Examples (Ví dụ)</h4>
                        <div className="space-y-2">
                             <div className="p-3 border-l-4 border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/40 rounded-r-md">
                                <p className="font-medium text-gray-800 dark:text-gray-200">"{tense.example_active_en}"</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 italic">"{tense.example_active_vi}"</p>
                             </div>
                             <div className="p-3 border-l-4 border-purple-400 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/40 rounded-r-md">
                                <p className="font-medium text-gray-800 dark:text-gray-200">"{tense.example_passive_en}"</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 italic">"{tense.example_passive_vi}"</p>
                             </div>
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
};


const TensesView: React.FC = () => {
    const [openTense, setOpenTense] = useState<string | null>(null);

    const handleToggle = (tenseName: string) => {
        setOpenTense(openTense === tenseName ? null : tenseName);
    };
    
    const categories = [...new Set(TENSES_DATA.map(t => t.category))];

    return (
        <div className="flex flex-col flex-1 h-full bg-gray-100 dark:bg-gray-900">
            <header className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <h1 className="text-xl font-semibold">English Tenses / Các thì trong Tiếng Anh</h1>
            </header>
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                <div className="max-w-4xl mx-auto space-y-8">
                    {categories.map(category => (
                        <div key={category}>
                             <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4 pb-2 border-b-2 border-blue-500">{category}</h2>
                             <div className="space-y-4">
                                {TENSES_DATA.filter(t => t.category === category).map(tense => (
                                     <TenseCard 
                                        key={tense.name_en} 
                                        tense={tense}
                                        isOpen={openTense === tense.name_en}
                                        onToggle={() => handleToggle(tense.name_en)}
                                    />
                                ))}
                             </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TensesView;
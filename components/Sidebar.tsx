import React from 'react';
import type { View } from '../types';
import {
    ChatIcon,
    GrammarIcon,
    VocabularyIcon,
    PronunciationIcon,
    TranslateIcon,
    IdiomIcon,
    TensesIcon,
    LessonPlanIcon,
    ExercisesIcon,
    SparklesIcon,
} from './IconComponents';

interface SidebarProps {
    currentView: View;
    onViewChange: (view: View) => void;
}

const NavItem: React.FC<{
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => {
    return (
        <button
            onClick={onClick}
            className={`flex items-center w-full px-4 py-3 text-left transition-colors duration-200 rounded-lg ${
                isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
        >
            <div className="flex-shrink-0 w-6 h-6">{icon}</div>
            <span className="ml-4 font-medium">{label}</span>
        </button>
    );
};

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
    const navItems = [
        { id: 'chat', label: 'Conversation', icon: <ChatIcon /> },
        { id: 'grammar', label: 'Grammar Check', icon: <GrammarIcon /> },
        { id: 'vocabulary', label: 'Vocabulary', icon: <VocabularyIcon /> },
        { id: 'pronunciation', label: 'Pronunciation', icon: <PronunciationIcon /> },
        { id: 'translation', label: 'Translation', icon: <TranslateIcon /> },
        { id: 'idioms', label: 'Idioms', icon: <IdiomIcon /> },
        { id: 'tenses', label: 'Tenses', icon: <TensesIcon /> },
        { id: 'exercises', label: 'Exercises', icon: <ExercisesIcon /> },
        { id: 'lessonplan', label: 'Lesson Plan', icon: <LessonPlanIcon /> },
    ];

    return (
        <aside className="w-64 flex-shrink-0 p-4 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="flex items-center px-2 mb-6">
                <div className="p-2 bg-blue-600 rounded-lg text-white">
                    <SparklesIcon />
                </div>
                <h1 className="ml-3 text-xl font-bold">LG Assistant</h1>
            </div>
            <nav className="flex-1 space-y-2">
                {navItems.map((item) => (
                    <NavItem
                        key={item.id}
                        label={item.label}
                        icon={item.icon}
                        isActive={currentView === item.id}
                        onClick={() => onViewChange(item.id as View)}
                    />
                ))}
            </nav>
            <div className="mt-auto text-center text-xs text-gray-400 dark:text-gray-500">
                <p>&copy; 2024 Mr. Lương Gia</p>
                <p>Powered by Gemini</p>
            </div>
        </aside>
    );
};

export default Sidebar;
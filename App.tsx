import React, { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ChatView from './components/ChatView';
import GrammarView from './components/GrammarView';
import VocabularyView from './components/VocabularyView';
import PronunciationView from './components/PronunciationView';
import TranslationView from './components/TranslationView';
import IdiomsView from './components/IdiomsView';
import TensesView from './components/TensesView';
import LessonPlanView from './components/LessonPlanView';
import ExercisesView from './components/ExercisesView';
import type { View } from './types';

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<View>('chat');

    const handleViewChange = useCallback((view: View) => {
        setCurrentView(view);
    }, []);

    const renderView = () => {
        switch (currentView) {
            case 'chat':
                return <ChatView />;
            case 'grammar':
                return <GrammarView />;
            case 'vocabulary':
                return <VocabularyView />;
            case 'pronunciation':
                return <PronunciationView />;
            case 'translation':
                return <TranslationView />;
            case 'idioms':
                return <IdiomsView />;
            case 'tenses':
                return <TensesView />;
            case 'lessonplan':
                return <LessonPlanView />;
            case 'exercises':
                return <ExercisesView />;
            default:
                return <ChatView />;
        }
    };

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <Sidebar currentView={currentView} onViewChange={handleViewChange} />
            <main className="flex-1 flex flex-col overflow-hidden">
                {renderView()}
            </main>
        </div>
    );
};

export default App;
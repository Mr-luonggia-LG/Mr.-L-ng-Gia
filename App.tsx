import React, { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import HomeView from './components/HomeView';
import ChatView from './components/ChatView';
import GrammarView from './components/GrammarView';
import VocabularyView from './components/VocabularyView';
import PronunciationView from './components/PronunciationView';
import TranslationView from './components/TranslationView';
import IdiomsView from './components/IdiomsView';
import TensesView from './components/TensesView';
import LessonPlanView from './components/LessonPlanView';
import ExercisesView from './components/ExercisesView';
import DailyPracticeView from './components/DailyPracticeView';
import LiveChatView from './components/LiveChatView';
import KnowledgeHubView from './components/KnowledgeHubView';
import AdminAuthModal from './components/AdminAuthModal';
import { ADMIN_PASSWORD } from './constants';
import type { View } from './types';

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<View>('home');
    const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    useEffect(() => {
        const isAdmin = sessionStorage.getItem('isAdminAuthenticated') === 'true';
        if (isAdmin) {
            setIsAdminAuthenticated(true);
        }
    }, []);

    const handleAdminLogin = (password: string): boolean => {
        if (password === ADMIN_PASSWORD) {
            setIsAdminAuthenticated(true);
            sessionStorage.setItem('isAdminAuthenticated', 'true');
            setIsAuthModalOpen(false);
            return true;
        }
        return false;
    };

    const handleViewChange = useCallback((view: View) => {
        setCurrentView(view);
    }, []);

    const renderView = () => {
        switch (currentView) {
            case 'home':
                return <HomeView />;
            case 'chat':
                return <ChatView />;
            case 'live_chat':
                return <LiveChatView />;
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
                return isAdminAuthenticated ? <LessonPlanView /> : <HomeView />;
            case 'exercises':
                return <ExercisesView />;
            case 'daily_practice':
                return <DailyPracticeView />;
            case 'knowledge_hub':
                return <KnowledgeHubView />;
            default:
                return <HomeView />;
        }
    };

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <Sidebar
                currentView={currentView}
                onViewChange={handleViewChange}
                isAdminAuthenticated={isAdminAuthenticated}
                onAdminClick={() => setIsAuthModalOpen(true)}
            />
            <main className="flex-1 flex flex-col overflow-hidden">
                {renderView()}
            </main>
            {isAuthModalOpen && (
                <AdminAuthModal
                    onClose={() => setIsAuthModalOpen(false)}
                    onLogin={handleAdminLogin}
                />
            )}
        </div>
    );
};

export default App;
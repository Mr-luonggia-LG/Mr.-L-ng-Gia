
import React, { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ChatView from './components/ChatView';
import GrammarView from './components/GrammarView';
import VocabularyView from './components/VocabularyView';
import PronunciationView from './components/PronunciationView';
import { View } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.Chat);

  const renderView = useCallback(() => {
    switch (currentView) {
      case View.Grammar:
        return <GrammarView />;
      case View.Vocabulary:
        return <VocabularyView />;
      case View.Pronunciation:
        return <PronunciationView />;
      case View.Chat:
      default:
        return <ChatView />;
    }
  }, [currentView]);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      <main className="flex-1 flex flex-col h-screen">
        {renderView()}
      </main>
    </div>
  );
};

export default App;

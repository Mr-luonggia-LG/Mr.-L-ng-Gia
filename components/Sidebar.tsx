
import React from 'react';
import { View } from '../types';
import { ChatIcon, GrammarIcon, VocabularyIcon, PronunciationIcon } from './IconComponents';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  const navItems = [
    { view: View.Chat, label: 'Conversation', icon: <ChatIcon /> },
    { view: View.Grammar, label: 'Grammar Check', icon: <GrammarIcon /> },
    { view: View.Vocabulary, label: 'Vocabulary Builder', icon: <VocabularyIcon /> },
    { view: View.Pronunciation, label: 'Pronunciation', icon: <PronunciationIcon /> },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 flex flex-col border-r border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-center h-20 border-b border-gray-200 dark:border-gray-700">
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            <span className="bg-blue-600 dark:bg-blue-400 text-white rounded-md px-2 py-1">LG</span> Assistant
        </div>
      </div>
      <nav className="flex-1 px-4 py-6">
        <ul>
          {navItems.map((item) => (
            <li key={item.view}>
              <button
                onClick={() => setCurrentView(item.view)}
                className={`flex items-center w-full px-4 py-3 my-1 text-left rounded-lg transition-colors duration-200 
                  ${
                    currentView === item.view
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
              >
                <span className="w-6 h-6 mr-3">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
       <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-center text-gray-500">
          Developed for Mr. Lương Gia's students.
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;

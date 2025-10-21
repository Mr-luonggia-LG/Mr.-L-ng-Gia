import React from 'react';
import { ChatIcon, DailyPracticeIcon, GrammarIcon, LiveChatIcon } from './IconComponents';

const FeatureCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    description: string;
}> = ({ icon, title, description }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg flex items-start gap-4 transition-transform hover:scale-105 duration-300">
        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            {icon}
        </div>
        <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
            <p className="mt-1 text-gray-600 dark:text-gray-400">{description}</p>
        </div>
    </div>
);


const HomeView: React.FC = () => {
    return (
        <div className="flex flex-col flex-1 h-full bg-gray-100 dark:bg-gray-900">
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                         <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-2xl text-white mb-4 shadow-lg">
                             <div className="w-12 h-12 bg-white rounded-lg text-blue-600 flex items-center justify-center font-bold text-3xl">
                                LG
                            </div>
                        </div>
                        <h2 className="text-4xl font-bold text-gray-800 dark:text-gray-200">Welcome to Tiếng Anh Lương Gia</h2>
                        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                            Your AI-powered partner for mastering English. Explore our features to enhance your skills.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FeatureCard 
                            icon={<ChatIcon className="w-7 h-7"/>}
                            title="AI Conversation Practice"
                            description="Chat with an AI tutor to improve your fluency, get corrections, and build confidence."
                        />
                         <FeatureCard 
                            icon={<LiveChatIcon className="w-7 h-7"/>}
                            title="Live Speaking Practice"
                            description="Engage in real-time voice conversations with an AI to practice your speaking and listening skills."
                        />
                         <FeatureCard 
                            icon={<GrammarIcon className="w-7 h-7"/>}
                            title="Comprehensive Tools"
                            description="From grammar checks and vocabulary builders to pronunciation practice, we have you covered."
                        />
                         <FeatureCard 
                            icon={<DailyPracticeIcon className="w-7 h-7"/>}
                            title="Daily Challenges"
                            description="Stay motivated with daily exercises designed to build a consistent learning habit."
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomeView;

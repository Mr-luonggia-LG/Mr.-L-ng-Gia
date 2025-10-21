import React, { useState, useRef, useEffect, useCallback } from 'react';
import { startChatSession, ApiHistoryContent } from '../services/geminiService';
import { ChatMessage, MessageSender } from '../types';
import { CHAT_SYSTEM_INSTRUCTION } from '../constants';
import { SendIcon, UserIcon, SparklesIcon, MicrophoneIcon } from './IconComponents';
import useSpeechRecognition from './useSpeechRecognition';
import type { Chat } from '@google/genai';

const CHAT_HISTORY_KEY = 'lg-assistant-chat-history';

// Converts the app's message format to the format required by the Gemini API history.
const mapMessagesToHistory = (messages: ChatMessage[]): ApiHistoryContent[] => {
    // Filter out the last message if it's an empty placeholder from the AI for streaming
    const filteredMessages = messages.filter(msg => msg.text.trim() !== '' || msg.sender === MessageSender.User);

    return filteredMessages.map(msg => ({
        role: msg.sender === MessageSender.User ? 'user' : 'model',
        parts: [{ text: msg.text }],
    }));
};


const ChatView: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatSession = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { isListening, transcript, startListening, stopListening, hasRecognitionSupport } = useSpeechRecognition();

    useEffect(() => {
        if (transcript) {
            setInput(transcript);
        }
    }, [transcript]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Effect to save messages to localStorage whenever they change
    useEffect(() => {
        if (messages.length > 0) {
            try {
                const serializedMessages = JSON.stringify(messages);
                localStorage.setItem(CHAT_HISTORY_KEY, serializedMessages);
            } catch (error) {
                console.error('Failed to save chat history to localStorage:', error);
            }
        }
    }, [messages]);


    const initializeNewChat = useCallback(async () => {
        setIsLoading(true);
        try {
            chatSession.current = startChatSession(CHAT_SYSTEM_INSTRUCTION);
            // FIX: The `sendMessageStream` method for chats expects a `message` property, not `parts`.
            const initialResponseStream = await chatSession.current.sendMessageStream({ message: "Hello!" });

            let initialText = '';
            setMessages([{ sender: MessageSender.AI, text: '' }]);
            for await (const chunk of initialResponseStream) {
                // FIX: Use chunk.text instead of chunk.text()
                initialText += chunk.text;
                setMessages([{ sender: MessageSender.AI, text: initialText }]);
            }

        } catch (error) {
            console.error('Error initializing chat:', error);
            setMessages([{ sender: MessageSender.AI, text: 'Sorry, I am having trouble starting. Please try refreshing the page.' }]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Effect to load history or start a new chat on component mount
    useEffect(() => {
        const loadAndInitialize = async () => {
            try {
                const storedMessages = localStorage.getItem(CHAT_HISTORY_KEY);
                if (storedMessages) {
                    const parsedMessages: ChatMessage[] = JSON.parse(storedMessages);
                    if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
                        setMessages(parsedMessages);
                        const history = mapMessagesToHistory(parsedMessages);
                        chatSession.current = startChatSession(CHAT_SYSTEM_INSTRUCTION, history);
                        return; // Exit after loading history
                    }
                }
            } catch (error) {
                console.error('Failed to load or parse chat history:', error);
                localStorage.removeItem(CHAT_HISTORY_KEY); // Clear corrupted data
            }
            
            // If no valid history was found, start a brand new chat
            await initializeNewChat();
        };
        
        loadAndInitialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isListening) {
            stopListening();
        }
        if (!input.trim() || isLoading || !chatSession.current) return;

        const userMessage: ChatMessage = { sender: MessageSender.User, text: input };
        const currentInput = input;
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // FIX: The `sendMessageStream` method for chats expects a `message` property, not `parts`.
            const stream = await chatSession.current.sendMessageStream({ message: currentInput });
            let aiResponseText = '';
            setMessages(prev => [...prev, { sender: MessageSender.AI, text: '' }]);

            for await (const chunk of stream) {
                // FIX: Use chunk.text instead of chunk.text()
                aiResponseText += chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = { sender: MessageSender.AI, text: aiResponseText };
                    return newMessages;
                });
            }
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage: ChatMessage = { sender: MessageSender.AI, text: "I'm sorry, I encountered an error. Please try again." };
            // FIX: Ensure error message is added correctly to the message list.
            setMessages(prev => {
                const newMessages = [...prev];
                // if the last message is an empty AI message, replace it
                if(newMessages[newMessages.length-1].sender === MessageSender.AI && newMessages[newMessages.length-1].text === ''){
                     newMessages[newMessages.length-1] = errorMessage;
                } else { // otherwise add it
                     newMessages.push(errorMessage);
                }
                return newMessages;
            });
        } finally {
            setIsLoading(false);
        }
    };

    const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
        const isUser = message.sender === MessageSender.User;
        return (
            <div className={`flex items-start gap-4 my-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
                {!isUser && (
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
                        <SparklesIcon />
                    </div>
                )}
                <div className={`max-w-xl p-4 rounded-2xl shadow-md ${isUser ? 'bg-blue-600 text-white rounded-br-lg' : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-lg'}`}>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{message.text}</p>
                </div>
                {isUser && (
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                        <UserIcon />
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col flex-1 h-full bg-gray-100 dark:bg-gray-900">
            <header className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <h1 className="text-xl font-semibold">Conversation Practice</h1>
            </header>
            <div className="flex-1 overflow-y-auto p-6">
                {messages.map((msg, index) => (
                    <MessageBubble key={index} message={msg} />
                ))}
                {isLoading && messages.length > 0 && messages[messages.length-1]?.sender === MessageSender.User && (
                     <div className="flex items-start gap-4 my-4 justify-start">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
                            <SparklesIcon />
                        </div>
                        <div className="max-w-xl p-4 rounded-2xl shadow-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-lg">
                           <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={isListening ? "Listening..." : "Type your message or use the microphone..."}
                        className={`flex-1 px-4 py-3 rounded-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none transition ${isListening ? 'ring-2 ring-red-500 focus:ring-2 focus:ring-red-500' : 'focus:ring-2 focus:ring-blue-500'}`}
                        disabled={isLoading}
                    />
                    {hasRecognitionSupport && (
                        <button
                            type="button"
                            onClick={isListening ? stopListening : startListening}
                            className={`w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'}`}
                            aria-label={isListening ? "Stop listening" : "Start listening"}
                        >
                            <MicrophoneIcon />
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <SendIcon />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatView;
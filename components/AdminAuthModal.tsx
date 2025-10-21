import React, { useState } from 'react';

interface AdminAuthModalProps {
    onClose: () => void;
    onLogin: (password: string) => boolean;
}

const AdminAuthModal: React.FC<AdminAuthModalProps> = ({ onClose, onLogin }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const success = onLogin(password);
        if (!success) {
            setError('Incorrect password. Please try again.');
            setPassword('');
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity"
            onClick={onClose}
        >
            <div 
                className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-sm transform transition-all"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-2xl font-bold mb-4 text-center text-gray-800 dark:text-gray-200">Admin Access</h2>
                <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                    Enter the password to unlock admin-only features.
                </p>
                <form onSubmit={handleSubmit}>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            setError('');
                        }}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50 dark:bg-gray-700 text-center"
                        placeholder="••••••••"
                        autoFocus
                    />
                    {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
                    <div className="flex gap-4 mt-6">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="w-full py-2 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 font-semibold transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="w-full py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold transition-colors"
                        >
                            Unlock
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminAuthModal;
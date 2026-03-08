import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { aiService } from '../../services/aiService';
import { studentService } from '../../services/studentService';
import { Student } from '../../types';
import { Card, Button } from '../UIComponents';

interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
}

interface AIChatInterfaceProps {
    onClose?: () => void;
    className?: string;
}

export const AIChatInterface: React.FC<AIChatInterfaceProps> = ({ onClose, className }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: `Olá, ${user?.name || 'Atleta'}! Sou seu Coach IA. Posso tirar dúvidas sobre exercícios, fisiologia e dicas de saúde. O que gostaria de saber hoje?`,
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [studentProfile, setStudentProfile] = useState<Student | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Fetch full student profile for better AI context
    useEffect(() => {
        if (user?.id) {
            studentService.getStudentById(user.id).then(profile => {
                if (profile) {
                    console.log("AI Context Loaded:", profile.name);
                    setStudentProfile(profile);
                }
            });
        }
    }, [user?.id]);

    const handleSend = async (text: string = input) => {
        if (!text.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            // Use full profile if available, otherwise basic auth user
            const context = studentProfile || user;
            const responseText = await aiService.chat(text, context);

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: responseText,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'system',
                content: 'Desculpe, tive um problema. Tente novamente.',
                timestamp: new Date()
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const suggestions = [
        "Para que serve a Creatina?",
        "Como melhorar meu agachamento?",
        "Qual a diferença de aeróbico e anaeróbico?"
    ];

    return (
        <div className={`flex flex-col h-[calc(100vh-140px)] md:h-[600px] w-full max-w-2xl mx-auto glass-card overflow-hidden ${className || ''}`}>
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-surface-dark flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center shadow-lg shadow-primary/20">
                        <span className="material-symbols-outlined text-black font-bold">smart_toy</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-white">Coach IA</h3>
                        <div className="flex items-center gap-1.5">
                            <span className="size-2 rounded-full bg-green-500 animate-pulse"></span>
                            <span className="text-xs text-gray-400">Online • Tira-Dúvidas</span>
                        </div>
                    </div>
                </div>
                {onClose && (
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-300">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                )}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}>
                            <div
                                className={`max-w-[85%] rounded-2xl p-3.5 text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                    ? 'bg-primary text-black rounded-tr-none font-medium'
                                    : msg.role === 'system'
                                        ? 'bg-red-500/10 text-red-400 border border-red-500/20 text-center'
                                        : 'bg-surface-elevated text-gray-100 border border-white/5 rounded-tl-none'
                                    }`}
                            >
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                <span className={`text-[10px] block mt-1 opacity-60 ${msg.role === 'user' ? 'text-black' : 'text-gray-400'}`}>
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-surface-elevated border border-white/5 rounded-2xl rounded-tl-none p-4 flex gap-1 items-center">
                            <span className="size-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                            <span className="size-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                            <span className="size-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {messages.length === 1 && (
                <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
                    {suggestions.map(s => (
                        <button
                            key={s}
                            onClick={() => handleSend(s)}
                            className="whitespace-nowrap px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-primary hover:bg-primary/10 transition-colors"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}

            {/* Input Area */}
            <div className="p-3 bg-surface-dark border-t border-white/10">
                <div className="flex gap-2 items-center bg-background-dark rounded-xl p-1 border border-white/5 focus-within:border-primary/50 transition-colors">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Digite sua dúvida..."
                        className="flex-1 bg-transparent border-none outline-none text-white px-3 py-2 text-sm placeholder-gray-500"
                        disabled={isTyping}
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={!input.trim() || isTyping}
                        className="p-2 rounded-lg bg-primary text-black disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-light transition-colors"
                    >
                        <span className="material-symbols-outlined text-xl">send</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

import React, { useState } from 'react';
import { useAuth } from '../../AuthContext';
import { socialService } from '../../services/socialService';
import { moderationService } from '../../services/moderationService';
import { showAlert } from '../UIComponents/CustomAlert';
import { Post } from '../../types';

interface CreatePostWidgetProps {
    onPostCreated: (post: Post) => void;
    trainerId: string;
}

export const CreatePostWidget: React.FC<CreatePostWidgetProps> = ({ onPostCreated, trainerId }) => {
    const { user } = useAuth();
    const [content, setContent] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedImage(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleRemoveImage = () => {
        setSelectedImage(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async () => {
        if ((!content.trim() && !selectedImage) || !user) return;

        setIsSubmitting(true);
        try {
            // 1. Moderate Content
            const moderation = moderationService.analyzeText(content);
            if (!moderation.safe) {
                // Shake or show error
                showAlert(
                    "Conteúdo Inadequado",
                    "Sua postagem contém termos que violam nossas diretrizes da comunidade. Por favor, revise seu texto e mantenha o respeito.",
                    "error"
                );
                setIsSubmitting(false);
                return;
            }

            const newPost = await socialService.createPost({
                authorId: user.id,
                authorName: user.name,
                authorAvatar: user.avatarUrl,
                content: content,
                trainerId,
                imageFile: selectedImage || undefined
            });
            onPostCreated(newPost);
            setContent('');
            handleRemoveImage();
            setIsExpanded(false);
        } catch (error) {
            console.error('Failed to create post', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!user) return null;

    return (
        <div className="bg-[#1e293b] rounded-xl border border-gray-700/50 p-4 mb-6 shadow-lg">
            <div className="flex gap-3">
                <img
                    src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.name}`}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover border border-gray-600"
                />
                <div className="flex-1">
                    {!isExpanded ? (
                        <div
                            onClick={() => setIsExpanded(true)}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-full px-4 py-2.5 text-gray-500 cursor-text hover:bg-black/40 transition-colors text-sm"
                        >
                            Compartilhe seu treino ou dúvida com a tribo...
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <textarea
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                placeholder="Compartilhe seu treino ou dúvida com a tribo..."
                                className="w-full bg-[#0f172a] border border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary resize-none min-h-[100px] text-sm"
                                autoFocus
                            />

                            {previewUrl && (
                                <div className="relative inline-block">
                                    <img src={previewUrl} alt="Preview" className="h-32 w-auto rounded-lg border border-gray-700" />
                                    <button
                                        onClick={handleRemoveImage}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-sm"
                                    >
                                        <span className="material-symbols-outlined text-[16px] block">close</span>
                                    </button>
                                </div>
                            )}

                            <div className="flex justify-between items-center pt-2 border-t border-gray-700/50">
                                <div className="flex gap-2">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleImageSelect}
                                        accept="image/*"
                                        className="hidden" // Hidden input
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="text-gray-400 hover:text-primary transition-colors flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-[#0f172a]"
                                        title="Adicionar imagem"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">image</span>
                                        <span className="text-xs font-medium">Foto</span>
                                    </button>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setIsExpanded(false);
                                            handleRemoveImage();
                                        }}
                                        className="px-4 py-1.5 text-gray-400 hover:text-white text-sm transition-colors"
                                        disabled={isSubmitting}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={(!content.trim() && !selectedImage) || isSubmitting}
                                        className="bg-primary hover:bg-primary-dark text-black font-semibold px-4 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? (
                                            <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                                        ) : (
                                            'Postar'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

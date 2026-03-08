import React, { useState } from 'react';
import { Post, Comment } from '../../types';
import { useAuth } from '../../AuthContext'; // Assuming AuthContext is at root
import { socialService } from '../../services/socialService';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PostCardProps {
    post: Post;
    onUpdate?: (updatedPost: Post) => void;
    onDelete?: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onUpdate, onDelete }) => {
    const { user } = useAuth();
    const [isLiked, setIsLiked] = useState<boolean>(user ? post.likes.includes(user.id) : false);
    const [likesCount, setLikesCount] = useState<number>(post.likes.length);
    const [showComments, setShowComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [localComments, setLocalComments] = useState<Comment[]>(post.comments);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleLike = async () => {
        if (!user) return;

        // Optimistic update
        const newLikedState = !isLiked;
        setIsLiked(newLikedState);
        setLikesCount(prev => newLikedState ? prev + 1 : prev - 1);

        try {
            await socialService.toggleLike(post.id, user.id);
            // We don't need full object update for likes usually, but if provided:
            if (onUpdate) {
                // Manually constructing updated object or fetching. 
                // Since toggleLike returns void now (per my service change), we can't pass updatedPost.
                // But the parent is likely just list rendering. The optimistic update is handled here.
            }
        } catch (error) {
            console.error('Falha ao curtir', error);
            // Revert on error
            setIsLiked(!newLikedState);
            setLikesCount(prev => !newLikedState ? prev + 1 : prev - 1);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Tem certeza que deseja excluir este post?')) return;
        setIsDeleting(true);
        try {
            await socialService.deletePost(post.id, post.imageUrl);
            if (onDelete) onDelete(post.id);
        } catch (error) {
            console.error("Erro ao deletar post", error);
            alert("Erro ao excluir post.");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !user) return;

        setIsSubmittingComment(true);
        try {
            const addedComment = await socialService.addComment(post.id, {
                authorId: user.id,
                authorName: user.name,
                authorAvatar: user.avatarUrl,
                content: newComment
            });

            setLocalComments([...localComments, addedComment]);
            setNewComment('');
        } catch (error) {
            console.error('Falha ao comentar', error);
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const canDelete = user && (user.id === post.authorId || user.role === 'TRAINER');

    return (
        <div className={`bg-[#1e293b] rounded-xl border border-gray-700/50 overflow-hidden mb-6 shadow-lg transition-opacity ${isDeleting ? 'opacity-50' : 'opacity-100'}`}>
            {/* Header */}
            <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <img
                        src={post.authorAvatar || `https://ui-avatars.com/api/?name=${post.authorName}&background=random`}
                        alt={post.authorName}
                        className="w-10 h-10 rounded-full object-cover border border-gray-600"
                    />
                    <div>
                        <h3 className="font-semibold text-gray-100 text-sm">{post.authorName}</h3>
                        <p className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ptBR })}
                        </p>
                    </div>
                </div>

                {canDelete && (
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="text-gray-500 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-white/5"
                        title="Excluir post"
                    >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="px-4 pb-2">
                <p className="text-gray-200 text-[15px] whitespace-pre-wrap">{post.content}</p>
            </div>

            {post.imageUrl && (
                <div className="mt-2 w-full bg-black/40">
                    <img
                        src={post.imageUrl}
                        alt="Post content"
                        className="w-full h-auto max-h-[500px] object-contain mx-auto"
                    />
                </div>
            )}

            {/* Actions */}
            <div className="px-4 py-3 border-t border-gray-700/50 flex items-center justify-between">
                <button
                    onClick={handleLike}
                    className={`flex items-center gap-2 text-sm transition-colors ${isLiked ? 'text-pink-500' : 'text-gray-400 hover:text-gray-200'}`}
                >
                    <span className="material-symbols-outlined text-[20px]">{isLiked ? 'favorite' : 'favorite'}</span>
                    <span>{likesCount} {likesCount === 1 ? 'curtida' : 'curtidas'}</span>
                </button>

                <button
                    onClick={() => setShowComments(!showComments)}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
                >
                    <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
                    <span>{localComments.length} {localComments.length === 1 ? 'comentário' : 'comentários'}</span>
                </button>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div className="bg-[#0f172a]/50 p-4 border-t border-gray-700/50">
                    <div className="mb-4 space-y-4 max-h-60 overflow-y-auto custom-scrollbar">
                        {localComments.length === 0 ? (
                            <p className="text-center text-gray-500 text-sm py-2">Seja o primeiro a comentar!</p>
                        ) : (
                            localComments.map(comment => (
                                <div key={comment.id} className="flex gap-3">
                                    <img
                                        src={comment.authorAvatar || `https://ui-avatars.com/api/?name=${comment.authorName}&background=random`}
                                        alt={comment.authorName}
                                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                    />
                                    <div className="flex-1 bg-[#1e293b] rounded-lg rounded-tl-none p-2 px-3">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <span className="font-medium text-xs text-gray-300">{comment.authorName}</span>
                                            <span className="text-[10px] text-gray-500">
                                                {formatDistanceToNow(new Date(comment.createdAt), { locale: ptBR })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-300 break-words">{comment.content}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <form onSubmit={handleCommentSubmit} className="flex gap-2">
                        <img
                            src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${user?.name || 'User'}`}
                            alt="Me"
                            className="w-8 h-8 rounded-full object-cover border border-gray-600"
                        />
                        <input
                            type="text"
                            value={newComment}
                            onChange={e => setNewComment(e.target.value)}
                            placeholder="Escreva um comentário..."
                            className="flex-1 bg-[#1e293b] border border-gray-600 rounded-full px-4 py-1.5 text-sm text-white focus:outline-none focus:border-primary placeholder-gray-500"
                            disabled={isSubmittingComment}
                        />
                        <button
                            type="submit"
                            disabled={!newComment.trim() || isSubmittingComment}
                            className="p-1.5 text-primary hover:bg-black/20 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="material-symbols-outlined text-[20px]">send</span>
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

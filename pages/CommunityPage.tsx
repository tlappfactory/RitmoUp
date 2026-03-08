import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { socialService } from '../services/socialService';
import { Post, UserRole, Student } from '../types';
import { PostCard } from '../components/Social/PostCard';
import { CreatePostWidget } from '../components/Social/CreatePostWidget';
import { DashboardLayout } from '../components/Layout';

// Helper component for robust avatar handling
const AvatarWithFallback = ({ src, alt, name }: { src?: string, alt: string, name: string }) => {
    const [error, setError] = useState(false);

    if (error || !src) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-700 text-xs font-bold text-gray-300">
                {name?.charAt(0).toUpperCase()}
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            onError={() => setError(true)}
            className="w-full h-full object-cover"
        />
    );
};

export const CommunityPage = () => {
    const { user } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    // Identify the "Tribe" ID. 
    // If student: tribe is their trainerId.
    // If trainer: tribe is their own id.
    const tribeId = user?.role === UserRole.STUDENT ? user?.trainerId : user?.id;

    // Tabs: 'feed' | 'ranking'
    const [activeTab, setActiveTab] = useState<'feed' | 'ranking'>('feed');
    // Ranking Type: 'global' | 'tribe'
    const [rankingType, setRankingType] = useState<'global' | 'tribe'>('global');

    const [rankingList, setRankingList] = useState<Student[]>([]);
    const [rankingLoading, setRankingLoading] = useState(false);

    useEffect(() => {
        const fetchPosts = async () => {
            if (!tribeId) {
                setLoading(false);
                return;
            }
            try {
                const data = await socialService.getFeed(tribeId);
                setPosts(data);
            } catch (error) {
                console.error('Failed to load feed', error);
            } finally {
                setLoading(false);
            }
        };
        fetchPosts();
    }, [tribeId]);

    // Fetch Ranking when tab or type changes
    useEffect(() => {
        if (activeTab === 'ranking') {
            const fetchRanking = async () => {
                setRankingLoading(true);
                try {
                    // Dynamic import to avoid cycles or just use imported service
                    const { gamificationService } = await import('../services/gamificationService');

                    let data = [];
                    if (rankingType === 'global') {
                        data = await gamificationService.getGlobalRanking();
                    } else if (rankingType === 'tribe' && tribeId) {
                        data = await gamificationService.getTribeRanking(tribeId);
                    }
                    setRankingList(data);
                } catch (error) {
                    console.error("Failed to load ranking", error);
                } finally {
                    setRankingLoading(false);
                }
            };
            fetchRanking();
        }
    }, [activeTab, rankingType, tribeId]);

    const handlePostCreated = (newPost: Post) => {
        setPosts([newPost, ...posts]);
    };

    const handlePostDeleted = (postId: string) => {
        setPosts(posts.filter(p => p.id !== postId));
    };

    if (!user) return null;

    return (
        <DashboardLayout title="Comunidade" rightAction={null}>
            <div className="max-w-2xl mx-auto pb-20">

                {/* Warning if no trainer assigned */}
                {user.role === UserRole.STUDENT && !tribeId && (
                    <div className="bg-[#1e293b] p-6 rounded-xl text-center border border-yellow-500/30 mb-6">
                        <span className="material-symbols-outlined text-4xl text-yellow-500 mb-2">warning</span>
                        <p className="text-gray-300">Você precisa estar vinculado a um treinador para acessar a comunidade.</p>
                    </div>
                )}

                {/* Tabs */}
                {tribeId && (
                    <div className="flex bg-[#1e293b] p-1 rounded-xl mb-6">
                        <button
                            onClick={() => setActiveTab('feed')}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'feed' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            Feed da Tribo
                        </button>
                        <button
                            onClick={() => setActiveTab('ranking')}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'ranking' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            Ranking
                        </button>
                    </div>
                )}

                {tribeId && activeTab === 'feed' && (
                    <>
                        <CreatePostWidget onPostCreated={handlePostCreated} trainerId={tribeId} />

                        {loading ? (
                            // Skeleton Loader
                            <div className="space-y-6">
                                {[1, 2].map(i => (
                                    <div key={i} className="bg-[#1e293b] rounded-xl h-64 animate-pulse border border-gray-700/50"></div>
                                ))}
                            </div>
                        ) : posts.length === 0 ? (
                            <div className="text-center py-10">
                                <div className="bg-[#1e293b] inline-flex p-4 rounded-full mb-4">
                                    <span className="material-symbols-outlined text-gray-500 text-3xl">forum</span>
                                </div>
                                <h3 className="text-gray-300 font-medium mb-1">Ainda não há posts</h3>
                                <p className="text-gray-500 text-sm">Seja o primeiro a compartilhar algo com a tribo!</p>
                            </div>
                        ) : (
                            posts.map(post => (
                                <PostCard key={post.id} post={post} onDelete={handlePostDeleted} />
                            ))
                        )}
                    </>
                )}

                {tribeId && activeTab === 'ranking' && (
                    <>
                        {/* Sub-tabs for Ranking Type */}
                        <div className="flex justify-center mb-6 gap-4">
                            <button
                                onClick={() => setRankingType('global')}
                                className={`relative group overflow-hidden pl-12 pr-6 py-3 rounded-2xl transition-all duration-300 border ${rankingType === 'global'
                                        ? 'bg-[#0f172a] border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                                        : 'bg-[#1e293b] border-transparent hover:border-blue-500/30 grayscale hover:grayscale-0'
                                    }`}
                            >
                                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full overflow-hidden shadow-sm">
                                    <img src="/ranking_global.png" alt="" className="w-full h-full object-cover" />
                                </div>
                                <div className="text-left">
                                    <span className={`block text-xs uppercase tracking-wider font-bold ${rankingType === 'global' ? 'text-blue-400' : 'text-gray-500 group-hover:text-blue-400'}`}>Ranking</span>
                                    <span className={`block text-sm font-bold ${rankingType === 'global' ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>Global</span>
                                </div>
                            </button>

                            <button
                                onClick={() => setRankingType('tribe')}
                                className={`relative group overflow-hidden pl-12 pr-6 py-3 rounded-2xl transition-all duration-300 border ${rankingType === 'tribe'
                                        ? 'bg-[#0f172a] border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                                        : 'bg-[#1e293b] border-transparent hover:border-purple-500/30 grayscale hover:grayscale-0'
                                    }`}
                            >
                                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full overflow-hidden shadow-sm">
                                    <img src="/ranking_tribe.png" alt="" className="w-full h-full object-cover" />
                                </div>
                                <div className="text-left">
                                    <span className={`block text-xs uppercase tracking-wider font-bold ${rankingType === 'tribe' ? 'text-purple-400' : 'text-gray-500 group-hover:text-purple-400'}`}>Ranking</span>
                                    <span className={`block text-sm font-bold ${rankingType === 'tribe' ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>Tribo</span>
                                </div>
                            </button>
                        </div>

                        {rankingLoading ? (
                            <div className="space-y-3">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="bg-[#1e293b] h-16 rounded-xl animate-pulse"></div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {rankingList.map((student, index) => {
                                    const isTop3 = index < 3;
                                    let medalColor = '';
                                    if (index === 0) medalColor = 'text-yellow-400';
                                    if (index === 1) medalColor = 'text-gray-300';
                                    if (index === 2) medalColor = 'text-amber-600';

                                    return (
                                        <div key={student.id} className={`bg-[#1e293b] p-4 rounded-xl flex items-center border ${student.id === user.id ? 'border-blue-500/50 bg-blue-900/10' : 'border-gray-700/30'}`}>
                                            <div className={`w-8 font-bold text-center mr-4 text-xl ${medalColor || 'text-gray-500'}`}>
                                                {index + 1}
                                            </div>

                                            <div className="relative mr-6">
                                                <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden ring-2 ring-white/10">
                                                    <AvatarWithFallback src={student.avatarUrl} alt={student.name} name={student.name} />
                                                </div>
                                                {isTop3 && (
                                                    <div className="absolute -top-1 -right-0.5 bg-gray-900 rounded-full z-10">
                                                        <span className={`material-symbols-outlined text-[16px] ${medalColor}`}>workspace_premium</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1">
                                                <h4 className={`font-medium ${student.id === user.id ? 'text-blue-400' : 'text-gray-200'}`}>
                                                    {student.name} {student.id === user.id && '(Você)'}
                                                </h4>
                                                <div className="flex items-center text-xs text-gray-500">
                                                    <span className="bg-gray-800 px-2 py-0.5 rounded text-gray-400 mr-2">
                                                        Lvl {student.gamification?.level || 1}
                                                    </span>
                                                    {student.gamification?.achievements?.length || 0} conquistas
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <span className="block text-lg font-bold text-white">
                                                    {student.gamification?.currentXp || 0}
                                                </span>
                                                <span className="text-[10px] text-gray-500 uppercase tracking-wider">XP Total</span>
                                            </div>
                                        </div>
                                    );
                                })}

                                {rankingList.length === 0 && (
                                    <div className="text-center py-10 text-gray-500">
                                        Nenhum competidor encontrado ainda.
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </DashboardLayout>
    );
};

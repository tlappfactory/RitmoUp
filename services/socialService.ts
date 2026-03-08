import { db, storage } from '../lib/firebase';
import { collection, addDoc, getDocs, query, where, orderBy, updateDoc, doc, arrayUnion, arrayRemove, deleteDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Post, Comment } from '../types';
import { moderationService } from './moderationService';

export const socialService = {
    getFeed: async (trainerId: string): Promise<Post[]> => {
        try {
            const postsRef = collection(db, 'posts');
            const q = query(
                postsRef,
                where('trainerId', '==', trainerId)
                // orderBy('createdAt', 'desc') // Requires index, filtering in memory for now if index fails often, but let's try strict first.
                // Actually to avoid "index required" errors during dev, let's fetch then sort if the dataset is small. 
                // Or better: use the index. If it fails, the user will check console. 
                // Let's try to query by trainerId and then sort in memory to be safe and fast without deploying indexes immediately.
            );

            const querySnapshot = await getDocs(q);
            const posts = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Post));

            return posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } catch (error) {
            console.error("Error fetching feed:", error);
            return [];
        }
    },

    createPost: async (postData: Omit<Post, 'id' | 'createdAt' | 'likes' | 'comments'> & { imageFile?: File }): Promise<Post> => {
        try {
            // Double check moderation
            const moderation = moderationService.analyzeText(postData.content);
            if (!moderation.safe) {
                throw new Error("Conteúdo bloqueado por conter termos ofensivos.");
            }

            let imageUrl = postData.imageUrl;

            // Handle Image Upload if file is provided
            if (postData.imageFile) {
                const storageRef = ref(storage, `posts/${Date.now()}_${postData.imageFile.name}`);
                const snapshot = await uploadBytes(storageRef, postData.imageFile);
                imageUrl = await getDownloadURL(snapshot.ref);
            }

            const newPost = {
                authorId: postData.authorId,
                authorName: postData.authorName,
                authorAvatar: postData.authorAvatar || '',
                content: postData.content,
                trainerId: postData.trainerId,
                imageUrl: imageUrl || '',
                likes: [],
                comments: [],
                createdAt: new Date().toISOString()
            };

            const docRef = await addDoc(collection(db, 'posts'), newPost);
            return { id: docRef.id, ...newPost };
        } catch (error) {
            console.error("Error creating post:", error);
            throw error;
        }
    },

    deletePost: async (postId: string, imageUrl?: string): Promise<void> => {
        try {
            await deleteDoc(doc(db, 'posts', postId));

            if (imageUrl) {
                // Try to delete image from storage if it exists
                try {
                    // Extract path from URL roughly or just assume a standard path? 
                    // Firebase URLs are complex. easier to rely on the fact that we can ref from URL
                    const imageRef = ref(storage, imageUrl);
                    await deleteObject(imageRef);
                } catch (imgError) {
                    console.warn("Could not delete associated image:", imgError);
                }
            }
        } catch (error) {
            console.error("Error deleting post:", error);
            throw error;
        }
    },

    toggleLike: async (postId: string, userId: string): Promise<void> => {
        try {
            const postRef = doc(db, 'posts', postId);
            const postSnap = await getDoc(postRef);

            if (postSnap.exists()) {
                const post = postSnap.data() as Post;
                const hasLiked = post.likes && post.likes.includes(userId);

                if (hasLiked) {
                    await updateDoc(postRef, {
                        likes: arrayRemove(userId)
                    });
                } else {
                    await updateDoc(postRef, {
                        likes: arrayUnion(userId)
                    });
                }
            }
        } catch (error) {
            console.error("Error toggling like:", error);
            throw error;
        }
    },

    addComment: async (postId: string, commentData: Omit<Comment, 'id' | 'createdAt' | 'postId'>): Promise<Comment> => {
        try {
            const newComment: Comment = {
                id: `comment-${Date.now()}`, // Generate ID locally for the array object
                postId,
                ...commentData,
                createdAt: new Date().toISOString()
            };

            const postRef = doc(db, 'posts', postId);
            await updateDoc(postRef, {
                comments: arrayUnion(newComment)
            });

            return newComment;
        } catch (error) {
            console.error("Error adding comment:", error);
            throw error;
        }
    }
};


import React, { useState, useEffect } from 'react';
import { Button, Input } from './UIComponents';
import { useAuth } from '../AuthContext';
import { useToast } from '../ToastContext';
import { userService } from '../services/userService';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';

// Generic interface for field configuration
export interface ProfileField {
    key: string;
    label: string;
    type?: 'text' | 'number' | 'textarea' | 'url' | 'file' | 'select';
    placeholder?: string;
    section?: string; // Grouping
    isArray?: boolean;
    options?: string[];
}

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    fields: ProfileField[];
    title?: string;
}

export const EditProfileModal = ({ isOpen, onClose, fields, title = 'Editar Perfil' }: EditProfileModalProps) => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [formData, setFormData] = useState<any>({});

    const handleChange = (key: string, value: string) => {
        setFormData((prev: any) => ({ ...prev, [key]: value }));
    };

    const handleFileChange = async (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && user) {
            const file = e.target.files[0];
            const storageRef = ref(storage, `avatars/${user.id}/${file.name}`);

            setIsUploading(true);
            try {
                console.log("Starting upload...");

                // Create a promise that rejects after 15 seconds
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error("Upload timed out. Check network or permissions.")), 15000);
                });

                const snapshot: any = await Promise.race([
                    uploadBytes(storageRef, file),
                    timeoutPromise
                ]);

                console.log("Upload done, getting URL...");
                const downloadURL = await getDownloadURL(snapshot.ref);
                console.log("URL got:", downloadURL);

                setFormData((prev: any) => ({ ...prev, [key]: downloadURL }));
                showToast('Foto carregada com sucesso!', 'success');
            } catch (error: any) {
                console.error("Error uploading file: ", error);

                let msg = 'Erro ao carregar foto.';
                if (error.message && error.message.includes('timed out')) {
                    msg = 'Tempo limite excedido. Verifique sua conexão ou permissões do Firebase.';
                } else if (error.code === 'storage/unauthorized') {
                    msg = 'Permissão negada. Verifique as Regras do Storage no Firebase.';
                }

                showToast(msg, 'error');
            } finally {
                setIsUploading(false);
            }
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            console.log("Saving user data...", formData);

            // Prepare data for save, handling arrays
            const dataToSave: any = { ...formData };
            fields.forEach(f => {
                if (f.isArray && typeof dataToSave[f.key] === 'string') {
                    dataToSave[f.key] = dataToSave[f.key].split(',').map((s: string) => s.trim()).filter(Boolean);
                }
            });

            await userService.updateUser(user.id, dataToSave);
            console.log("Save complete.");
            showToast('Perfil atualizado com sucesso!', 'success');
            onClose();
        } catch (error) {
            console.error("Error saving profile:", error);
            showToast('Erro ao atualizar perfil.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        if (user && isOpen) {
            const initialData: any = {};
            fields.forEach(f => {
                let val = user[f.key];

                // Handle optional/undefined
                if (val === undefined || val === null) {
                    val = '';
                }

                // Handle Arrays (join for display)
                if (f.isArray && Array.isArray(val)) {
                    val = val.join(', ');
                } else if (f.isArray && !Array.isArray(val)) {
                    // Fallback if data is corrupted or empty
                    val = '';
                }

                // @ts-ignore
                initialData[f.key] = val;
            });
            setFormData(initialData);
        }
    }, [user, isOpen, fields]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-surface-dark border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-fade-in-up">

                {/* Header */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center sticky top-0 bg-surface-dark rounded-t-2xl z-10 w-full">
                    <h3 className="font-bold text-lg text-white">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Body (Scrollable) */}
                <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar">
                    {fields.some(f => f.key === 'avatarUrl') && (
                        <div className="flex justify-center mb-6">
                            <div className="relative group">
                                <img
                                    src={formData['avatarUrl'] || user?.avatarUrl}
                                    className={`size-24 rounded-full border-2 border-primary object-cover ${isUploading ? 'opacity-50' : ''}`}
                                    onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150')}
                                />
                                {isUploading && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="material-symbols-outlined animate-spin text-white">progress_activity</span>
                                    </div>
                                )}
                                {!isUploading && (
                                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-xs text-white font-bold">Preview</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {fields.map((field) => (
                        <div key={field.key}>
                            <label className="text-sm font-bold text-gray-400 ml-1 mb-1 block">{field.label}</label>
                            {field.type === 'textarea' ? (
                                <textarea
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all h-24 resize-none"
                                    placeholder={field.placeholder}
                                    value={formData[field.key]}
                                    onChange={(e) => handleChange(field.key, e.target.value)}
                                />
                            ) : field.type === 'file' ? (
                                <div className="space-y-4">
                                    {formData[field.key] && (
                                        <div className="flex justify-center">
                                            {isUploading ? (
                                                <p className="text-xs text-yellow-500 mb-2 font-bold animate-pulse">Enviando foto...</p>
                                            ) : (
                                                <p className="text-xs text-green-400 mb-2 flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-sm">check_circle</span>
                                                    Foto carregada! Clique em salvar.
                                                </p>
                                            )}
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        disabled={isUploading}
                                        className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-primary file:text-surface-dark hover:file:bg-primary/80 cursor-pointer bg-white/5 rounded-xl border border-white/10 p-2 disabled:opacity-50"
                                        onChange={(e) => handleFileChange(field.key, e)}
                                    />
                                </div>
                            ) : field.type === 'select' ? (
                                <select
                                    className="w-full bg-[#202020] border border-white/10 rounded-xl p-3 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all appearance-none cursor-pointer"
                                    value={formData[field.key] || ''}
                                    onChange={(e) => handleChange(field.key, e.target.value)}
                                >
                                    <option value="" disabled className="bg-[#202020] text-gray-400">{field.placeholder || 'Selecione...'}</option>
                                    {field.options?.map((opt) => (
                                        <option key={opt} value={opt} className="bg-[#202020] text-white">
                                            {opt}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <Input
                                    type={field.type || 'text'}
                                    value={formData[field.key]}
                                    onChange={(e: any) => handleChange(field.key, e.target.value)}
                                    placeholder={field.placeholder}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 flex justify-end gap-3 rounded-b-2xl bg-surface-dark">
                    <Button variant="ghost" onClick={onClose} disabled={isSaving || isUploading}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={isSaving || isUploading}>
                        {isSaving ? 'Salvando...' : isUploading ? 'Aguarde Upload...' : 'Salvar Alterações'}
                    </Button>
                </div>
            </div>
        </div >
    );
};

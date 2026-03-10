import React, { useState } from 'react';
import { useAuth } from '../AuthContext';

export const DebugLogger = () => {
  const { user, firebaseUser, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Only show in development or if a special flag is set (optional)
  // For now, we show it to help the user diagnose the TWA issue.

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] pointer-events-none">
      {isOpen ? (
        <div className="bg-black/95 text-[10px] font-mono p-3 border-t border-primary/30 pointer-events-auto max-h-40 overflow-y-auto">
          <div className="flex justify-between items-center mb-2">
            <span className="text-primary font-bold">AUTH DIAGNOSTICS</span>
            <button 
              onClick={() => setIsOpen(false)}
              className="px-2 py-0.5 bg-white/10 rounded hover:bg-white/20 text-white"
            >
              Hide
            </button>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div className="text-gray-500">Loading State:</div>
            <div className={loading ? 'text-yellow-400' : 'text-green-400'}>
              {loading ? 'TRUE (Hanging?)' : 'FALSE'}
            </div>
            
            <div className="text-gray-500">Firebase User:</div>
            <div className={firebaseUser ? 'text-green-400' : 'text-red-400'}>
              {firebaseUser ? `${firebaseUser.email || 'Sim'} (${firebaseUser.uid.slice(0, 5)}...)` : 'NULL'}
            </div>

            <div className="text-gray-500">Firestore Profile:</div>
            <div className={user ? 'text-green-400' : 'text-red-400'}>
              {user ? `YES (${user.role})` : 'NULL'}
            </div>

            <div className="text-gray-500">Current Path:</div>
            <div className="text-white truncate">{window.location.hash || window.location.pathname}</div>
          </div>
        </div>
      ) : (
        <div className="p-2 flex justify-end">
          <button 
            onClick={() => setIsOpen(true)}
            className="pointer-events-auto size-8 bg-black/50 backdrop-blur rounded-full border border-white/10 flex items-center justify-center text-primary hover:bg-black"
          >
            <span className="material-symbols-outlined text-sm">bug_report</span>
          </button>
        </div>
      )}
    </div>
  );
};

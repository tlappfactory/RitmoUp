import { useCallback } from 'react';

// Simplified Web Haptics
export const useHaptics = () => {

    const vibrate = (pattern: number | number[]) => {
        if (typeof window !== 'undefined' && navigator.vibrate) {
            try {
                navigator.vibrate(pattern);
            } catch (error) {
                console.warn('Vibration failed', error);
            }
        }
    };

    // Light impact (for simple interactions like button presses)
    const hapticImpact = useCallback(async () => {
        vibrate(50);
    }, []);

    // Selection changed (for scrolling pickers or sliders)
    const hapticSelectionChanged = useCallback(async () => {
        vibrate(20);
    }, []);

    // Selection start (drag start)
    const hapticSelectionStart = useCallback(async () => {
        vibrate(20);
    }, []);

    // Selection end (drag end)
    const hapticSelectionEnd = useCallback(async () => {
        vibrate(20);
    }, []);

    // Notifications
    const hapticNotification = useCallback(async (type: any) => {
        // Simple patterns depending on the type
        vibrate([100, 50, 100]); // generic success/notification pattern
    }, []);

    return {
        hapticImpact,
        hapticSelectionChanged,
        hapticSelectionStart,
        hapticSelectionEnd,
        hapticNotification
    };
};

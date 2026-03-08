import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { useCallback } from 'react';

/**
 * Hook to provide easy access to Haptic feedback
 */
export const useHaptics = () => {

    // Light impact (for simple interactions like button presses)
    const hapticImpact = useCallback(async (style: ImpactStyle = ImpactStyle.Light) => {
        try {
            await Haptics.impact({ style });
        } catch (error) {
            console.warn('Haptics not supported or failed', error);
        }
    }, []);

    // Selection changed (for scrolling pickers or sliders)
    const hapticSelectionChanged = useCallback(async () => {
        try {
            await Haptics.selectionChanged();
        } catch (error) {
            console.warn('Haptics not supported or failed', error);
        }
    }, []);

    // Selection start (drag start)
    const hapticSelectionStart = useCallback(async () => {
        try {
            await Haptics.selectionStart();
        } catch (error) {
            console.warn('Haptics not supported or failed', error);
        }
    }, []);

    // Selection end (drag end)
    const hapticSelectionEnd = useCallback(async () => {
        try {
            await Haptics.selectionEnd();
        } catch (error) {
            console.warn('Haptics not supported or failed', error);
        }
    }, []);

    // Notifications (Success, Warning, Error)
    const hapticNotification = useCallback(async (type: NotificationType) => {
        try {
            await Haptics.notification({ type });
        } catch (error) {
            console.warn('Haptics not supported or failed', error);
        }
    }, []);

    return {
        hapticImpact,
        hapticSelectionChanged,
        hapticSelectionStart,
        hapticSelectionEnd,
        hapticNotification
    };
};

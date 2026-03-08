import { doc, getDoc, getFirestore } from 'firebase/firestore';

interface SystemConfig {
    latest_version: string;
    min_version: string;
    update_url?: string;
    maintenance_mode?: boolean;
}

export const checkAppVersion = async (currentVersion: string) => {
    try {
        const db = getFirestore();
        const configRef = doc(db, 'system', 'config');
        const configSnap = await getDoc(configRef);

        if (configSnap.exists()) {
            const config = configSnap.data() as SystemConfig;

            if (isOutdated(currentVersion, config.latest_version)) {
                return {
                    hasUpdate: true,
                    latestVersion: config.latest_version,
                    updateUrl: config.update_url || 'https://play.google.com/store/apps/details?id=com.ritmoup.app'
                };
            }
        } else {
            console.warn("Version config document not found in Firestore. Assuming app is up to date.");
        }
        return { hasUpdate: false, latestVersion: currentVersion, updateUrl: '' };
    } catch (error) {
        console.error("Error checking version:", error);
        // Return "no update" instead of throwing error to prevent UI crash
        return { hasUpdate: false, latestVersion: currentVersion, updateUrl: '' };
    }
};

const isOutdated = (current: string, target: string) => {
    const c = current.split('.').map(Number);
    const t = target.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
        if (c[i] < t[i]) return true;
        if (c[i] > t[i]) return false;
    }
    return false;
};

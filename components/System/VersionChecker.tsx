
export const VersionChecker = () => {
    // In a PWA, Service Workers handle updates (vite-plugin-pwa is configured with autoUpdate).
    // Native version checking via Capacitor is no longer necessary.
    return null;
};

import React, { useState, useEffect, useRef } from 'react';

interface PullToRefreshProps {
    onRefresh: () => Promise<void>;
    children: React.ReactNode;
    scrollAreaRef?: React.RefObject<HTMLElement>;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children, scrollAreaRef }) => {
    const [startY, setStartY] = useState(0);
    const [pulling, setPulling] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [pullHeight, setPullHeight] = useState(0);
    const contentRef = useRef<HTMLDivElement>(null);
    const THRESHOLD = 80; // px to pull to trigger refresh

    const handleTouchStart = (e: React.TouchEvent) => {
        const scrollTop = scrollAreaRef?.current ? scrollAreaRef.current.scrollTop : window.scrollY;

        if (scrollTop === 0) {
            setStartY(e.touches[0].clientY);
            setPulling(true);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!pulling) return;

        const currentY = e.touches[0].clientY;
        const diff = currentY - startY;

        if (diff > 0) {
            // Resistance effect
            const newHeight = Math.min(diff * 0.4, 120);
            setPullHeight(newHeight);

            // Prevent native scroll if we are pulling down at the top
            if (diff > 10 && e.cancelable) {
                // This might need passive: false listener to work perfectly, 
                // but React synthetic events don't easily allow that.
                // Reliance on touch-action: none or manipulation css helps.
            }
        } else {
            setPullHeight(0);
            setPulling(false);
        }
    };

    const handleTouchEnd = async () => {
        if (!pulling) return;

        setPulling(false);
        if (pullHeight > THRESHOLD) {
            setRefreshing(true);
            setPullHeight(60); // Stay visible while refreshing
            try {
                await onRefresh();
            } finally {
                setRefreshing(false);
                setPullHeight(0);
            }
        } else {
            setPullHeight(0);
        }
    };

    return (
        <div
            ref={contentRef}
            className={`relative transition-transform duration-200 ease-out h-full`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
                transform: `translateY(${pullHeight}px)`,
                // Important for pull to refresh to work without native scroll interference
                touchAction: 'pan-y'
            }}
        >
            <div
                className="absolute top-0 left-0 w-full flex items-center justify-center pointer-events-none"
                style={{
                    height: '60px',
                    top: '-60px',
                    opacity: pullHeight > 0 ? 1 : 0,
                    transition: 'opacity 0.2s',
                    zIndex: 10
                }}
            >
                {refreshing ? (
                    <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                ) : (
                    <span
                        className="material-symbols-outlined text-gray-400 transition-transform duration-200"
                        style={{ transform: `rotate(${pullHeight > THRESHOLD ? 180 : 0}deg)` }}
                    >
                        arrow_downward
                    </span>
                )}
            </div>
            {children}
        </div>
    );
};

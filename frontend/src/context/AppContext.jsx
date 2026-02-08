import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getStats } from '../services/api';

const AppContext = createContext();

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within AppProvider');
    }
    return context;
};

export function AppProvider({ children }) {
    // Files state - initialized safe
    const [files, setFiles] = useState({
        original: [],
        renamed: []
    });

    // Rename progress state
    const [renameProgress, setRenameProgress] = useState({
        isProcessing: false,
        currentBatch: 0,
        totalBatches: 0,
        currentFile: 0,
        totalFiles: 0,
        status: 'idle'
    });

    // Statistics state - initialized safe with all nested props
    const [stats, setStats] = useState({
        today: { count: 0, successful: 0, failed: 0 },
        last24h: { count: 0, successful: 0, failed: 0 },
        totalFetched: 0,
        successRate: 0,
        recentActivity: []
    });

    // Activity log - separate state for easier updates
    const [activityLog, setActivityLog] = useState([]);

    // UI state
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Initial load flag to prevent double-fetching in React 18 Strict Mode
    const [isInitialized, setIsInitialized] = useState(false);

    // Safe stats update helper
    const updateStatsSafe = useCallback((data) => {
        if (!data || !data.success || !data.stats) return;

        setStats({
            today: data.stats.today || { count: 0, successful: 0, failed: 0 },
            last24h: data.stats.last24h || { count: 0, successful: 0, failed: 0 },
            totalFetched: files.original.length,
            successRate: data.stats.successRate || 0,
            recentActivity: data.stats.recentActivity || []
        });

        // Sync activity log with recent activity
        if (data.stats.recentActivity && Array.isArray(data.stats.recentActivity)) {
            setActivityLog(data.stats.recentActivity);
        }
    }, [files.original.length]);

    // Fetch statistics function
    const fetchStats = useCallback(async () => {
        try {
            const response = await getStats();
            updateStatsSafe(response);
        } catch (err) {
            console.warn('Failed to fetch stats (non-critical):', err);
            // We don't set global error here to avoid blocking valid UI operations
        }
    }, [updateStatsSafe]);

    // Load initial data
    useEffect(() => {
        if (isInitialized) return;

        const init = async () => {
            await fetchStats();
            setIsInitialized(true);
        };

        init();
    }, [isInitialized, fetchStats]);

    // Polling for stats (every 30s)
    useEffect(() => {
        if (!isInitialized) return;

        const interval = setInterval(() => {
            fetchStats();
        }, 30000);

        return () => clearInterval(interval);
    }, [isInitialized, fetchStats]);

    // Update files helper
    const updateFiles = useCallback((originalFiles, renamedFiles = []) => {
        // Ensure we always have an array
        const safeOriginal = Array.isArray(originalFiles) ? originalFiles : [];

        // Ensure renamed array matches length or is empty
        let safeRenamed = [];
        if (Array.isArray(renamedFiles) && renamedFiles.length > 0) {
            safeRenamed = renamedFiles;
        } else {
            // Default to original filenames if no renamed files provided
            safeRenamed = safeOriginal.map(f => f?.filename || '');
        }

        setFiles({
            original: safeOriginal,
            renamed: safeRenamed
        });

        // Update total fetched count in stats immediately
        setStats(prev => ({
            ...prev,
            totalFetched: safeOriginal.length
        }));
    }, []);

    // Update rename progress helper
    const updateRenameProgress = useCallback((progress) => {
        setRenameProgress(prev => ({ ...prev, ...progress }));
    }, []);

    // Manual activity log entry
    const addActivityLog = useCallback((entry) => {
        setActivityLog(prev => {
            const newLog = [entry, ...(prev || [])];
            return newLog.slice(0, 50); // Keep last 50
        });
    }, []);

    const clearError = useCallback(() => setError(null), []);

    const value = {
        files,
        updateFiles,
        renameProgress,
        updateRenameProgress,
        stats,
        setStats,
        fetchStats, // Exposed for manual refresh
        activityLog,
        addActivityLog,
        isLoading,
        setIsLoading,
        error,
        setError,
        clearError
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
}

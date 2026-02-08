import React, { useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';

export default function ActivityLog() {
    const { activityLog } = useApp();
    const logEndRef = useRef(null);

    // ❌ AUTO-SCROLL DISABLED - User requested to remove this behavior
    // Previously caused unwanted scrolling to bottom on every update
    // useEffect(() => {
    //     logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    // }, [activityLog]);

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const getStatusIcon = (status) => {
        return status === 'success' ? '✓' : '✗';
    };

    const getStatusColor = (status) => {
        return status === 'success' ? 'text-accent-green' : 'text-accent-red';
    };

    return (
        <div className="glass-card p-6">
            <h3 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
                <span>📋</span>
                Recent Activity
            </h3>

            <div className="bg-primary-bg rounded-lg p-4 max-h-[400px] overflow-y-auto font-mono text-sm">
                {!activityLog || activityLog.length === 0 ? (
                    <div className="text-center py-12 text-text-secondary">
                        <div className="text-4xl mb-2">📭</div>
                        <p>No activity yet</p>
                        <p className="text-xs mt-1">Rename files to see activity here</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {activityLog.map((activity) => (
                            <div
                                key={activity.id}
                                className="py-2 border-b border-primary-border last:border-0"
                            >
                                <div className="flex items-start gap-3">
                                    {/* Timestamp */}
                                    <span className="text-text-secondary text-xs whitespace-nowrap mt-0.5">
                                        [{formatTimestamp(activity.timestamp)}]
                                    </span>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start gap-2">
                                            <span className={`${getStatusColor(activity.status)} font-bold`}>
                                                {getStatusIcon(activity.status)}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-text-primary break-all">
                                                    <span className="text-text-secondary">Renamed:</span>{' '}
                                                    <span className="text-accent-purple">"{activity.original}"</span>
                                                    {' → '}
                                                    <span className="text-accent-green">"{activity.renamed}"</span>
                                                </p>

                                                {/* Platforms */}
                                                {activity.platforms && activity.platforms.length > 0 && (
                                                    <p className="text-text-secondary text-xs mt-1">
                                                        Platforms: {activity.platforms.join(', ')}
                                                    </p>
                                                )}

                                                {/* Error message if failed */}
                                                {activity.status === 'failed' && activity.error && (
                                                    <p className="text-accent-red text-xs mt-1">
                                                        Error: {activity.error}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={logEndRef} />
                    </div>
                )}
            </div>
        </div>
    );
}

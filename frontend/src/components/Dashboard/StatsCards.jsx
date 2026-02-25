import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export default function StatsCards() {
    const { stats } = useApp();
    const [uploadStats, setUploadStats] = useState({ uploadedToday: 0, uploadedLast24h: 0 });

    useEffect(() => {
        const fetchUploadStats = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/upload-history`);
                const data = await res.json();
                if (data.success) {
                    setUploadStats({
                        uploadedToday: data.uploadedToday ?? 0,
                        uploadedLast24h: data.uploadedLast24h ?? 0
                    });
                }
            } catch { /* silently ignore */ }
        };
        fetchUploadStats();
        const timer = setInterval(fetchUploadStats, 30000); // refresh every 30s
        return () => clearInterval(timer);
    }, []);

    const cards = [
        {
            title: "Today's Renames",
            value: stats?.today?.count || 0,
            icon: '📅',
            accent: '#6C63FF',
            subtext: `${stats?.today?.successful || 0} successful`
        },
        {
            title: 'Last 24h Renames',
            value: stats?.last24h?.count || 0,
            icon: '🕐',
            accent: '#3B82F6',
            subtext: `${stats?.last24h?.successful || 0} successful`
        },
        {
            title: 'Uploaded Today',
            value: uploadStats.uploadedToday,
            icon: '📤',
            accent: '#10B981',
            subtext: 'Across all 4 platforms'
        },
        {
            title: 'Uploads Last 24h',
            value: uploadStats.uploadedLast24h,
            icon: '🚀',
            accent: '#F97316',
            subtext: 'Video links submitted'
        },
        {
            title: 'Total Files Fetched',
            value: stats?.totalFetched || 0,
            icon: '📊',
            accent: '#00D9A3',
            subtext: 'Current session'
        },
        {
            title: 'Success Rate',
            value: `${stats?.successRate || 0}%`,
            icon: '✅',
            accent: '#6C63FF',
            subtext: 'Overall rename performance',
            isPercent: true,
            percent: stats?.successRate || 0
        }
    ];

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '24px' }}>
            {cards.map((card, i) => (
                <div
                    key={i}
                    className="glass-card animate-fadeIn"
                    style={{
                        padding: 'clamp(14px,3vw,20px)',
                        borderBottom: `3px solid ${card.accent}`,
                        animationDelay: `${i * 0.07}s`
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div>
                            <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                {card.title}
                            </p>
                            <div style={{ fontSize: 'clamp(22px,4vw,32px)', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1 }}>
                                {card.value}
                            </div>
                        </div>
                        <div style={{ fontSize: 'clamp(22px,4vw,28px)', opacity: 0.85 }}>{card.icon}</div>
                    </div>

                    {card.isPercent && (
                        <div style={{ height: '4px', background: 'var(--color-border)', borderRadius: '2px', overflow: 'hidden', marginBottom: '8px' }}>
                            <div style={{
                                height: '100%', width: `${card.percent}%`,
                                background: `linear-gradient(90deg, ${card.accent}, #00D9A3)`,
                                borderRadius: '2px', transition: 'width 0.6s ease'
                            }} />
                        </div>
                    )}

                    <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{card.subtext}</p>
                </div>
            ))}
        </div>
    );
}

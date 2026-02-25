import React from 'react';

export default function Header({ theme, toggleTheme }) {
    const platforms = [
        { name: 'RPMShare', color: '#3B82F6' },
        { name: 'StreamP2P', color: '#8B5CF6' },
        { name: 'SeekStreaming', color: '#10B981' },
        { name: 'UPnShare', color: '#F97316' }
    ];

    const isDark = theme === 'dark';

    return (
        <header style={{
            background: 'var(--color-secondary-bg)',
            borderBottom: '1px solid var(--color-border)',
            padding: '10px 16px',
            marginBottom: '20px',
            transition: 'background 0.3s ease'
        }}>
            <div style={{
                maxWidth: '1280px',
                margin: '0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                flexWrap: 'wrap'
            }}>
                {/* Title — always visible, shrinks on tiny screens */}
                <h1 style={{
                    fontSize: 'clamp(14px, 3.5vw, 22px)',
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #6C63FF, #00D9A3)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    margin: 0,
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                }}>
                    🎬 Video Rename Manager
                </h1>

                {/* Right side: platform dots + toggle — wrap together */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    flexWrap: 'wrap',
                    flexShrink: 1,
                    minWidth: 0
                }}>
                    {/* Platform dots */}
                    {platforms.map(p => (
                        <div key={p.name} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            background: 'var(--color-primary-bg)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '6px',
                            padding: '4px 8px',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: 'var(--color-text-primary)',
                            whiteSpace: 'nowrap'
                        }}>
                            <div style={{
                                width: '7px', height: '7px',
                                borderRadius: '50%',
                                background: p.color,
                                boxShadow: `0 0 5px ${p.color}`,
                                flexShrink: 0,
                                animation: 'pulse 2s ease infinite'
                            }} />
                            {/* Hide name on very small screens — just show dot */}
                            <span style={{ display: 'var(--badge-text, inline)' }}>
                                {p.name}
                            </span>
                        </div>
                    ))}

                    {/* Theme toggle pill */}
                    <button
                        onClick={toggleTheme}
                        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            background: isDark ? '#1a1a2e' : '#e8e8f5',
                            border: '1px solid var(--color-border)',
                            borderRadius: '999px',
                            padding: '5px 12px',
                            cursor: 'pointer',
                            color: 'var(--color-text-primary)',
                            fontSize: '12px',
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                            transition: 'all 0.25s ease'
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'var(--color-accent-purple)';
                            e.currentTarget.style.color = '#fff';
                            e.currentTarget.style.borderColor = 'var(--color-accent-purple)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = isDark ? '#1a1a2e' : '#e8e8f5';
                            e.currentTarget.style.color = 'var(--color-text-primary)';
                            e.currentTarget.style.borderColor = 'var(--color-border)';
                        }}
                    >
                        {isDark ? '☀️ Light' : '🌙 Dark'}
                    </button>
                </div>
            </div>
        </header>
    );
}

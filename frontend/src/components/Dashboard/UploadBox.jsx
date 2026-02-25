import React, { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'react-toastify';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const PLATFORMS = [
    { id: 'streamp2p', label: 'StreamP2P', color: '#8B5CF6' },
    { id: 'seekstreaming', label: 'SeekStreaming', color: '#10B981' },
    { id: 'upnshare', label: 'UPnShare', color: '#F97316' },
    { id: 'rpmshare', label: 'RPMShare', color: '#3B82F6' }
];

/** Derive a readable name from the URL */
function nameFromUrl(url) {
    try {
        const p = new URL(url).pathname;
        const f = p.split('/').filter(Boolean).pop() || 'video';
        return decodeURIComponent(f.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '));
    } catch { return 'video'; }
}

/** Auto-resize textarea to fit content */
function useAutoResize(ref, value) {
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = Math.max(110, el.scrollHeight) + 'px';
    }, [value]);
}

// ── Tiny platform status card ────────────────────────────────
function PlatformCard({ platform, state }) {
    const status = state?.status ?? 'Waiting';
    const pct = state?.percent ?? 0;
    const isActive = !['Waiting', 'Completed', 'Failed', 'Error'].includes(status);
    const isDone = status === 'Completed';
    const isFailed = status === 'Failed' || status === 'Error';

    return (
        <div style={{
            background: 'var(--color-primary-bg)',
            border: `1px solid ${isDone ? '#00D9A344' : isFailed ? '#FF6B6B44' : isActive ? platform.color + '66' : 'var(--color-border)'}`,
            borderRadius: '10px', padding: '10px 14px',
            transition: 'all 0.3s ease'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '7px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <div style={{
                        width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                        background: isDone ? '#00D9A3' : isFailed ? '#FF6B6B' : platform.color,
                        boxShadow: isActive ? `0 0 6px ${platform.color}` : 'none'
                    }} />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        {platform.label}
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '12px' }}>
                        {isDone ? '✅' : isFailed ? '❌' : isActive ? '⏳' : '⬜'}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: isDone ? '#00D9A3' : isFailed ? '#FF6B6B' : 'var(--color-text-secondary)' }}>
                        {status}
                    </span>
                </div>
            </div>

            {/* Progress bar */}
            <div style={{ height: '3px', background: 'var(--color-border)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{
                    height: '100%', width: `${pct}%`,
                    background: isDone ? '#00D9A3' : isFailed ? '#FF6B6B' : `linear-gradient(90deg,${platform.color},${platform.color}cc)`,
                    borderRadius: '2px', transition: 'width 0.5s ease'
                }} />
            </div>

            {state?.error && (
                <div style={{ fontSize: '10px', color: '#FF6B6B', marginTop: '5px', wordBreak: 'break-word' }}>
                    {state.error}
                </div>
            )}
            {state?.videos?.length > 0 && (
                <div style={{ fontSize: '10px', color: '#00D9A3', marginTop: '5px' }}>
                    🎬 {state.videos.length} video{state.videos.length > 1 ? 's' : ''} uploaded
                </div>
            )}
        </div>
    );
}

// ── Main component ────────────────────────────────────────────
export default function UploadBox() {
    const [urls, setUrls] = useState('');
    const [uploading, setUploading] = useState(false);
    const [currentLink, setCurrentLink] = useState('');
    const [currentIdx, setCurrentIdx] = useState(0);
    const [totalLinks, setTotalLinks] = useState(0);
    const [pStates, setPStates] = useState({});   // per-platform state
    const [history, setHistory] = useState([]);
    const stopRef = useRef(false);
    const textareaRef = useRef(null);
    useAutoResize(textareaRef, urls);

    const resetPlatforms = () =>
        setPStates(Object.fromEntries(PLATFORMS.map(p => [p.id, { status: 'Submitting', percent: 5 }])));

    // ── Poll a single platform task until done ───────────────
    const pollPlatform = useCallback(async (platform, taskId) => {
        const maxAttempts = 180; // 15 min at 5s intervals
        for (let i = 0; i < maxAttempts; i++) {
            if (stopRef.current) return;
            await new Promise(r => setTimeout(r, 5000));
            try {
                const res = await fetch(`${API_BASE}/api/upload-status/${platform}/${taskId}`);
                const data = await res.json();
                setPStates(prev => ({
                    ...prev,
                    [platform]: {
                        status: data.status,
                        percent: data.percent,
                        videos: data.videos || [],
                        error: data.error
                    }
                }));
                if (data.status === 'Completed' || data.status === 'Failed' || data.status === 'Error') {
                    return data;
                }
            } catch (err) {
                setPStates(prev => ({ ...prev, [platform]: { ...prev[platform], status: 'Error', error: err.message, percent: 0 } }));
                return { status: 'Error' };
            }
        }
    }, []);

    // ── Upload one link ──────────────────────────────────────
    const uploadOne = useCallback(async (url, name) => {
        setCurrentLink(name);
        resetPlatforms();

        // 1. Submit to all 4 platforms
        let submissions;
        try {
            const res = await fetch(`${API_BASE}/api/upload-url`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, name })
            });
            submissions = await res.json();
        } catch (err) {
            toast.error(`❌ Failed to submit: ${err.message}`);
            PLATFORMS.forEach(p =>
                setPStates(prev => ({ ...prev, [p.id]: { status: 'Error', percent: 0, error: err.message } }))
            );
            return;
        }

        if (!submissions.success) {
            toast.error(`❌ ${submissions.error || 'Submit failed'}`);
            return;
        }

        // 2. Update UI with submission results + start polling in parallel
        const polls = [];
        PLATFORMS.forEach(p => {
            const sub = submissions.platforms[p.id];
            if (sub?.taskId) {
                setPStates(prev => ({ ...prev, [p.id]: { status: 'Queued', percent: 10, taskId: sub.taskId } }));
                polls.push(pollPlatform(p.id, sub.taskId));
            } else {
                setPStates(prev => ({ ...prev, [p.id]: { status: 'Failed', percent: 0, error: sub?.error || 'No task ID' } }));
            }
        });

        // 3. Wait for all polls to finish
        const results = await Promise.allSettled(polls);
        const successCount = results.filter(r => r.value?.status === 'Completed').length;

        setHistory(h => [{ name, url, timestamp: new Date().toISOString(), successCount }, ...h.slice(0, 49)]);
        toast.success(`✅ ${name} — ${successCount}/4 platforms done`);
    }, [pollPlatform]);

    // ── Main upload handler ──────────────────────────────────
    const handleUpload = useCallback(async () => {
        const linkList = urls.split('\n').map(l => l.trim()).filter(Boolean);
        if (linkList.length === 0) { toast.error('Paste at least one URL.'); return; }

        stopRef.current = false;
        setUploading(true);
        setTotalLinks(linkList.length);

        for (let i = 0; i < linkList.length; i++) {
            if (stopRef.current) break;
            setCurrentIdx(i + 1);
            const url = linkList[i];
            const name = nameFromUrl(url);
            toast.info(`📤 [${i + 1}/${linkList.length}] ${name}`, { autoClose: 2500 });
            await uploadOne(url, name);

            if (!stopRef.current && i < linkList.length - 1) {
                toast.info('⏳ 5s gap…', { autoClose: 5000 });
                await new Promise(r => setTimeout(r, 5000));
            }
        }

        setUploading(false);
        setCurrentLink('');
        if (linkList.length > 1 && !stopRef.current) toast.success('🎉 All uploads complete!');
    }, [urls, uploadOne]);

    const handleStop = () => {
        stopRef.current = true;
        setUploading(false);
        setCurrentLink('');
        toast.info('Stopped.');
    };

    const linkCount = urls.split('\n').map(l => l.trim()).filter(Boolean).length;
    const showStatus = uploading || Object.values(pStates).some(s => s.status !== 'Waiting');

    return (
        <div style={{
            background: 'var(--color-card-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: '16px',
            padding: 'clamp(14px,4vw,24px)',
            marginBottom: '24px',
            backdropFilter: 'blur(12px)',
            boxShadow: 'var(--shadow-card)'
        }}>
            {/* Header */}
            <h3 style={{ margin: '0 0 4px', fontSize: 'clamp(15px,3.5vw,18px)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                📤 Upload by URL
            </h3>
            <p style={{ margin: '0 0 14px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                Paste video links (one per line) — uploaded to all 4 platforms simultaneously
            </p>

            {/* Textarea */}
            <textarea
                ref={textareaRef}
                placeholder={`https://example.com/video1.mp4\nhttps://example.com/video2.mp4\nhttps://example.com/video3.mp4\n\u2026paste as many links as you want`}
                value={urls}
                onChange={e => setUrls(e.target.value)}
                disabled={uploading}
                rows={4}
                style={{
                    width: '100%', boxSizing: 'border-box',
                    minHeight: '110px', resize: 'none', overflow: 'hidden',
                    background: 'var(--color-primary-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '10px', padding: '12px 16px',
                    color: 'var(--color-text-primary)',
                    fontSize: '13px', fontFamily: 'monospace', lineHeight: '1.75',
                    outline: 'none', transition: 'border-color 0.2s',
                    marginBottom: '8px'
                }}
                onFocus={e => e.target.style.borderColor = '#6C63FF'}
                onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
            />

            {/* Link count hint */}
            {linkCount > 0 && (
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
                    {linkCount} link{linkCount > 1 ? 's' : ''} detected
                    {linkCount > 1 ? ' — processed one by one with a 3s gap' : ''}
                </div>
            )}

            {/* Upload / Stop button */}
            <div style={{ marginBottom: showStatus ? '18px' : '0' }}>
                {!uploading ? (
                    <button
                        onClick={handleUpload}
                        disabled={linkCount === 0}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            background: linkCount === 0 ? 'var(--color-border)' : 'linear-gradient(135deg,#6C63FF,#00D9A3)',
                            border: 'none', borderRadius: '10px', padding: '11px 28px',
                            color: '#fff', fontSize: '14px', fontWeight: 700,
                            cursor: linkCount === 0 ? 'not-allowed' : 'pointer',
                            boxShadow: linkCount > 0 ? '0 4px 15px rgba(108,99,255,0.4)' : 'none',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        🚀 Upload{linkCount > 1 ? ` (${linkCount})` : ''}
                    </button>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                        <button
                            onClick={handleStop}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                background: 'linear-gradient(135deg,#FF6B6B,#ee5a5a)',
                                border: 'none', borderRadius: '10px', padding: '11px 22px',
                                color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer'
                            }}
                        >
                            ⏹️ Stop
                        </button>
                        <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                            {currentIdx}/{totalLinks} — <strong style={{ color: 'var(--color-text-primary)' }}>{currentLink}</strong>
                        </span>
                    </div>
                )}
            </div>

            {/* Live platform status grid */}
            {showStatus && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: '8px', marginTop: '4px', marginBottom: history.length > 0 ? '18px' : '0' }}>
                    {PLATFORMS.map(p => (
                        <PlatformCard key={p.id} platform={p} state={pStates[p.id]} />
                    ))}
                </div>
            )}

            {/* History */}
            {history.length > 0 && (
                <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Recent Uploads
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '180px', overflowY: 'auto' }}>
                        {history.map((h, i) => (
                            <div key={i} style={{
                                background: 'var(--color-primary-bg)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '7px', padding: '8px 12px',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap'
                            }}>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {h.name}
                                </span>
                                <span style={{ fontSize: '11px', color: h.successCount === 4 ? '#00D9A3' : '#F97316', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                    ✅ {h.successCount}/4
                                </span>
                                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                                    {new Date(h.timestamp).toLocaleTimeString()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

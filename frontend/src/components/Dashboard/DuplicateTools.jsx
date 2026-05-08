import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { findDuplicatesStream, deleteDuplicatesStream, findMissingFilesStream } from '../../services/api.js';

// ─── Platform display helpers ────────────────────────────
const PLATFORM_LABELS = {
    vidplay: { label: 'VidPlay', color: '#E34D67', short: 'VP' },
    streamp2p: { label: 'StreamP2P', color: '#8B5CF6', short: 'P2P' },
    seekstreaming: { label: 'SeekStreaming', color: '#10B981', short: 'SEEK' },
    upnshare: { label: 'UPnShare', color: '#F97316', short: 'UPN' }
};

function PlatformBadge({ platform, dim }) {
    const info = PLATFORM_LABELS[platform] || { label: platform, color: '#6C63FF' };
    return (
        <span style={{
            backgroundColor: info.color + (dim ? '11' : '22'),
            color: dim ? '#888' : info.color,
            border: `1px solid ${info.color}${dim ? '33' : '55'}`,
            borderRadius: '6px', padding: '2px 8px',
            fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap'
        }}>
            {info.label}
        </span>
    );
}

function Modal({ title, subtitle, onClose, children }) {
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '10px'
        }} onClick={onClose}>
            <div style={{
                background: 'var(--color-secondary-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: '16px', width: '100%', maxWidth: '860px',
                maxHeight: '92vh', display: 'flex', flexDirection: 'column',
                boxShadow: '0 25px 60px rgba(0,0,0,0.9)'
            }} onClick={e => e.stopPropagation()}>
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 20px', borderBottom: '1px solid var(--color-border)', flexShrink: 0
                }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: 'clamp(15px,3vw,18px)', fontWeight: 700, color: 'var(--color-text-primary)' }}>{title}</h3>
                        {subtitle && <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '3px' }}>{subtitle}</div>}
                    </div>
                    <button onClick={onClose} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--color-text-secondary)', fontSize: '24px', lineHeight: 1, padding: '4px 10px',
                        borderRadius: '6px'
                    }}>×</button>
                </div>
                <div style={{ overflowY: 'auto', padding: 'clamp(14px,3vw,20px)', flex: 1 }}>
                    {children}
                </div>
            </div>
        </div>
    );
}

function Spinner({ size = 18 }) {
    return (
        <span style={{
            display: 'inline-block', width: size, height: size,
            border: '3px solid rgba(255,255,255,0.2)',
            borderTop: '3px solid #fff', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite', flexShrink: 0
        }} />
    );
}

function SummaryBanner({ ok, text }) {
    return (
        <div style={{
            background: ok ? 'rgba(0,217,163,0.12)' : 'rgba(255,107,107,0.12)',
            border: `1px solid ${ok ? '#00D9A355' : '#FF6B6B55'}`,
            borderRadius: '10px', padding: '13px 18px', marginBottom: '18px',
            fontSize: '14px', fontWeight: 600,
            color: ok ? 'var(--color-accent-green)' : 'var(--color-accent-red)'
        }}>{text}</div>
    );
}

// ═══════════════════════════════════════════════════════════
// PROGRESS BAR COMPONENT — shared by all 3 operations
// ═══════════════════════════════════════════════════════════
function ProgressPanel({ label, progress }) {
    const pct = progress.overallPercent ?? 0;
    const phase = progress.phase || 'scanning';
    const deleteInfo = progress.deleteProgress || null;

    return (
        <div style={{
            background: 'var(--color-card-bg, #1a1a2e)',
            border: '1px solid var(--color-border, #2d2d44)',
            borderRadius: '12px', padding: '16px', marginTop: '16px'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary, #fff)' }}>
                    ⚡ {label}
                </span>
                <span style={{
                    fontSize: '20px', fontWeight: 800, lineHeight: 1,
                    background: 'linear-gradient(135deg, #6C63FF, #00D9A3)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                }}>
                    {phase === 'deleting' && deleteInfo ? deleteInfo.percent : pct}%
                </span>
            </div>

            {/* Phase label */}
            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary, #888)', marginBottom: '8px', fontWeight: 600 }}>
                {phase === 'scanning' ? '📡 Scanning all platforms...' : phase === 'deleting' ? '🗑️ Deleting duplicates...' : '📡 Processing...'}
            </div>

            {/* Main progress bar */}
            <div style={{
                height: '8px', borderRadius: '4px', overflow: 'hidden',
                background: 'var(--color-border, #2d2d44)', marginBottom: '12px'
            }}>
                <div style={{
                    height: '100%',
                    width: `${phase === 'deleting' && deleteInfo ? deleteInfo.percent : pct}%`,
                    background: phase === 'deleting' ? 'linear-gradient(90deg, #FF6B6B, #ee5a5a)' : 'linear-gradient(90deg, #6C63FF, #00D9A3)',
                    borderRadius: '4px',
                    transition: 'width 0.3s ease',
                    boxShadow: '0 0 10px rgba(108, 99, 255, 0.5)'
                }} />
            </div>

            {/* Per-platform mini progress — only during scanning phase */}
            {phase === 'scanning' && progress.allProgress && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {Object.entries(PLATFORM_LABELS).map(([key, info]) => {
                        const pp = progress.allProgress[key] || { pagesCompleted: 0, totalPages: 1 };
                        const ppct = pp.totalPages > 0 ? Math.round((pp.pagesCompleted / pp.totalPages) * 100) : 0;
                        return (
                            <div key={key} style={{
                                flex: '1 1 80px', minWidth: '80px',
                                background: info.color + '15',
                                border: `1px solid ${info.color}44`,
                                borderRadius: '8px', padding: '8px', textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '10px', fontWeight: 700, color: info.color, marginBottom: '4px' }}>
                                    {info.short}
                                </div>
                                <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-text-primary, #fff)' }}>
                                    {ppct}%
                                </div>
                                <div style={{
                                    height: '3px', borderRadius: '2px', overflow: 'hidden',
                                    background: info.color + '22', marginTop: '4px'
                                }}>
                                    <div style={{
                                        height: '100%', width: `${ppct}%`,
                                        background: info.color,
                                        borderRadius: '2px', transition: 'width 0.3s ease'
                                    }} />
                                </div>
                                <div style={{ fontSize: '9px', color: 'var(--color-text-secondary, #888)', marginTop: '3px' }}>
                                    {pp.pagesCompleted}/{pp.totalPages} pages
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Delete progress details */}
            {phase === 'deleting' && deleteInfo && (
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', textAlign: 'center', marginTop: '4px' }}>
                    Deleted {deleteInfo.deleted || 0} / {deleteInfo.total || 0} files
                    {deleteInfo.name && <span> — "{deleteInfo.name}"</span>}
                </div>
            )}
        </div>
    );
}

// ══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════
export default function DuplicateTools() {
    const [loading, setLoading] = useState(null); // 'find'|'delete'|'missing'|null
    const [progress, setProgress] = useState({ overallPercent: 0, phase: 'scanning', allProgress: {}, deleteProgress: null });
    const [modal, setModal] = useState(null);
    const [enabledPlatforms, setEnabledPlatforms] = useState({
        vidplay: true,
        streamp2p: true,
        seekstreaming: true,
        upnshare: true
    });

    const getActivePlatforms = () => Object.entries(enabledPlatforms).filter(([, v]) => v).map(([k]) => k);
    const activeCount = getActivePlatforms().length;

    async function handleFindDuplicates() {
        setLoading('find');
        setProgress({ overallPercent: 0, phase: 'scanning', allProgress: {}, deleteProgress: null });
        try {
        const data = await findDuplicatesStream((p) => {
                setProgress(prev => ({
                    ...prev,
                    phase: p.phase || 'scanning',
                    overallPercent: p.overallPercent ?? prev.overallPercent,
                    allProgress: p.allProgress || prev.allProgress
                }));
            }, getActivePlatforms());
            setModal({ type: 'find', data });
            toast.info(`🔍 ${data.totalDuplicates} duplicate copies found`);
        } catch (err) {
            toast.error(`❌ Find Duplicates failed: ${err.message}`);
        } finally { setLoading(null); }
    }

    async function handleDeleteDuplicates() {
        if (!window.confirm('⚠️ DELETE DUPLICATES\n\nThis will permanently delete extra copies.\nOne copy per file will be kept.\n\nProceed?')) return;

        setLoading('delete');
        setProgress({ overallPercent: 0, phase: 'scanning', allProgress: {}, deleteProgress: null });
        try {
            const data = await deleteDuplicatesStream((p) => {
                if (p.phase === 'scanning') {
                    setProgress(prev => ({
                        ...prev,
                        phase: 'scanning',
                        overallPercent: p.overallPercent ?? prev.overallPercent,
                        allProgress: p.allProgress || prev.allProgress
                    }));
                } else if (p.phase === 'deleting') {
                    setProgress(prev => ({
                        ...prev,
                        phase: 'deleting',
                        deleteProgress: { deleted: p.deleted, failed: p.failed, current: p.current, total: p.total, percent: p.percent, name: p.name }
                    }));
                }
            }, getActivePlatforms());
            setModal({ type: 'delete', data });
            toast.success(data.totalDeleted > 0
                ? `🗑️ Deleted ${data.totalDeleted} duplicate copies!`
                : '✅ No duplicate copies to delete.');
        } catch (err) {
            toast.error(`❌ Delete failed: ${err.message}`);
        } finally { setLoading(null); }
    }

    async function handleMissingFiles() {
        setLoading('missing');
        setProgress({ overallPercent: 0, phase: 'scanning', allProgress: {}, deleteProgress: null });
        try {
            const data = await findMissingFilesStream((p) => {
                setProgress(prev => ({
                    ...prev,
                    phase: p.phase || 'scanning',
                    overallPercent: p.overallPercent ?? prev.overallPercent,
                    allProgress: p.allProgress || prev.allProgress
                }));
            }, getActivePlatforms());
            setModal({ type: 'missing', data });
            toast.info(data.totalMissing > 0
                ? `📋 ${data.totalMissing} file(s) missing from at least 1 platform`
                : '✅ All platforms are perfectly in sync!');
        } catch (err) {
            toast.error(`❌ Missing Files check failed: ${err.message}`);
        } finally { setLoading(null); }
    }

    function btnStyle(gradient, glow) {
    const disabled = loading !== null || activeCount === 0;
        return {
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '13px 16px', borderRadius: '10px', border: 'none',
            background: disabled ? 'var(--color-border)' : gradient,
            color: '#fff', fontSize: 'clamp(12px,2vw,14px)', fontWeight: 700,
            cursor: disabled ? 'not-allowed' : 'pointer',
            boxShadow: disabled ? 'none' : glow,
            transition: 'all 0.2s ease',
            flex: '1 1 140px', minHeight: '48px',
            opacity: disabled ? 0.6 : 1
        };
    }

    const loadingLabel = loading === 'find' ? 'Scanning for duplicates…'
        : loading === 'delete' ? 'Deleting duplicates…'
            : loading === 'missing' ? 'Comparing all 4 platforms…' : '';

    // ── Modal: Find Duplicates ─────────────────────────────
    function renderFindModal(data) {
        const { duplicates, totalDuplicates } = data;
        const hasDups = totalDuplicates > 0;
        let totalGroups = 0;
        for (const p of ['streamp2p', 'vidplay', 'seekstreaming', 'upnshare']) totalGroups += (duplicates[p] || []).length;
        return (
            <>
                <SummaryBanner ok={!hasDups} text={hasDups
                    ? `⚠️ ${totalGroups} duplicate group(s) — ${totalDuplicates} extra file(s) to delete`
                    : '✅ No duplicates found on any platform!'} />
                {hasDups && (
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '14px', lineHeight: 1.6 }}>
                        ℹ️ <strong>Duplicate</strong> = same filename more than once on the <strong>same platform</strong>.<br />
                        <span style={{ color: '#00D9A3' }}>✅ GREEN</span> = kept &nbsp;|&nbsp; <span style={{ color: '#FF6B6B' }}>❌ RED</span> = will be deleted
                    </div>
                )}
                {['streamp2p', 'vidplay', 'seekstreaming', 'upnshare'].map(platform => {
                    const dups = duplicates[platform] || [];
                    if (dups.length === 0) return null;
                    return (
                        <div key={platform} style={{ marginBottom: '22px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                <PlatformBadge platform={platform} />
                                <span style={{ color: '#FF6B6B', fontSize: '12px', fontWeight: 600 }}>
                                    {dups.length} group(s) · {dups.reduce((s, d) => s + d.remove.length, 0)} to delete
                                </span>
                            </div>
                            {dups.map((dup, i) => (
                                <div key={i} style={{ background: 'var(--color-primary-bg)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '10px 14px', marginBottom: '7px' }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                                        <span style={{ fontSize: '11px', color: '#00D9A3', fontWeight: 700, background: 'rgba(0,217,163,0.12)', border: '1px solid #00D9A344', borderRadius: '4px', padding: '1px 6px', whiteSpace: 'nowrap', marginTop: '1px' }}>✅ KEEP</span>
                                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)', wordBreak: 'break-word' }}>{dup.keep.name}</div>
                                    </div>
                                    {dup.remove.map((r, j) => (
                                        <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                            <span style={{ fontSize: '11px', color: '#FF6B6B', fontWeight: 700, background: 'rgba(255,107,107,0.12)', border: '1px solid #FF6B6B44', borderRadius: '4px', padding: '1px 6px', whiteSpace: 'nowrap', marginTop: '1px' }}>❌ DEL</span>
                                            <div style={{ fontSize: '13px', color: '#FF6B6B88', wordBreak: 'break-word' }}>{r.name}</div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    );
                })}
                {!hasDups && <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: '30px 0' }}>🎉 No platform has any duplicates!</div>}
            </>
        );
    }

    // ── Modal: Delete Result ───────────────────────────────
    function renderDeleteModal(data) {
        const { results, totalDeleted, totalFailed } = data;
        return (
            <>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '18px', flexWrap: 'wrap' }}>
                    {[{ val: totalDeleted, label: 'Deleted', color: '#00D9A3' }, { val: totalFailed, label: 'Failed', color: '#FF6B6B' }].map(({ val, label, color }) => (
                        <div key={label} style={{ flex: '1 1 120px', background: color + '15', border: `1px solid ${color}44`, borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
                            <div style={{ fontSize: '32px', fontWeight: 800, color }}>{val}</div>
                            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>{label}</div>
                        </div>
                    ))}
                </div>
                {results.length === 0
                    ? <SummaryBanner ok text="✅ No duplicate copies were found to delete." />
                    : <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {results.map((r, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--color-primary-bg)', border: `1px solid ${r.success ? '#00D9A322' : '#FF6B6B33'}`, borderRadius: '7px', padding: '9px 12px', flexWrap: 'wrap' }}>
                                <span>{r.success ? '✅' : '❌'}</span>
                                <PlatformBadge platform={r.platform} />
                                <span style={{ fontSize: '12px', color: 'var(--color-text-primary)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                                {r.error && <span style={{ fontSize: '10px', color: '#FF6B6B' }}>{r.error}</span>}
                            </div>
                        ))}
                    </div>
                }
            </>
        );
    }

    // ── Modal: Missing Files ───────────────────────────────
    function renderMissingModal(data) {
        const { missingFiles, totalMissing, platformCounts, uniqueCounts, syncedCount, totalUnique } = data;
        return (
            <>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
                    {Object.entries(platformCounts).map(([platform, count]) => (
                        <div key={platform} style={{ flex: '1 1 100px', background: 'var(--color-primary-bg)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '10px 16px', textAlign: 'center' }}>
                            <PlatformBadge platform={platform} />
                            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '8px' }}>{count}</div>
                            <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>raw files</div>
                            {uniqueCounts && (
                                <div style={{ fontSize: '12px', fontWeight: 700, color: '#6C63FF', marginTop: '4px' }}>
                                    {uniqueCounts[platform]} unique
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                {totalUnique != null && (
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
                        <div style={{ flex: '1 1 140px', background: 'rgba(0,217,163,0.1)', border: '1px solid #00D9A344', borderRadius: '8px', padding: '12px 16px', textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 800, color: '#00D9A3' }}>{syncedCount}</div>
                            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>✅ On all 4 platforms</div>
                        </div>
                        <div style={{ flex: '1 1 140px', background: 'rgba(255,107,107,0.1)', border: '1px solid #FF6B6B44', borderRadius: '8px', padding: '12px 16px', textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 800, color: '#FF6B6B' }}>{totalMissing}</div>
                            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>⚠️ Missing from ≥1 platform</div>
                        </div>
                        <div style={{ flex: '1 1 140px', background: 'rgba(108,99,255,0.1)', border: '1px solid #6C63FF44', borderRadius: '8px', padding: '12px 16px', textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 800, color: '#6C63FF' }}>{totalUnique}</div>
                            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>📁 Total unique titles</div>
                        </div>
                    </div>
                )}
                <SummaryBanner ok={totalMissing === 0} text={totalMissing > 0
                    ? `⚠️ ${totalMissing} title(s) are missing from at least 1 platform`
                    : '✅ All 4 platforms have exactly the same titles!'} />
                {missingFiles.map((item, i) => (
                    <div key={i} style={{ background: 'var(--color-primary-bg)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '12px 14px', marginBottom: '8px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '9px', wordBreak: 'break-word' }}>📁 {item.filename}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '5px' }}>
                            <span style={{ fontSize: '11px', color: '#00D9A3', width: '60px', flexShrink: 0 }}>✅ Present:</span>
                            {item.presentIn.map(p => <PlatformBadge key={p} platform={p} />)}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '11px', color: '#FF6B6B', width: '60px', flexShrink: 0 }}>❌ Missing:</span>
                            {item.missingIn.map(p => (
                                <span key={p} style={{ background: '#FF6B6B22', color: '#FF6B6B', border: '1px solid #FF6B6B55', borderRadius: '6px', padding: '2px 8px', fontSize: '11px', fontWeight: 700 }}>
                                    {PLATFORM_LABELS[p]?.label || p}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </>
        );
    }

    // ── Render ─────────────────────────────────────────────
    return (
        <>
            <div style={{
                background: 'var(--color-card-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: '16px',
                padding: 'clamp(14px,4vw,24px)',
                marginBottom: '24px',
                backdropFilter: 'blur(12px)',
                boxShadow: 'var(--shadow-card)',
                transition: 'background 0.3s ease'
            }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: 'clamp(15px,3.5vw,18px)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    🛠️ File Management Tools
                </h3>
                <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    Toggle platforms on/off, then scan for duplicates or missing files
                </p>

                {/* ── Platform Toggles ── */}
                <div style={{
                    display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px',
                    padding: '12px 14px',
                    background: 'var(--color-primary-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '12px'
                }}>
                    {Object.entries(PLATFORM_LABELS).map(([key, info]) => {
                        const isOn = enabledPlatforms[key];
                        return (
                            <button
                                key={key}
                                onClick={() => setEnabledPlatforms(prev => ({ ...prev, [key]: !prev[key] }))}
                                disabled={loading !== null}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    padding: '8px 14px', borderRadius: '10px',
                                    border: `1.5px solid ${isOn ? info.color : 'var(--color-border)'}`,
                                    background: isOn ? info.color + '18' : 'transparent',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.25s ease',
                                    opacity: loading ? 0.5 : 1,
                                    flex: '1 1 120px', minWidth: '120px'
                                }}
                            >
                                {/* Toggle pill */}
                                <div style={{
                                    width: '36px', height: '20px', borderRadius: '10px',
                                    background: isOn ? info.color : 'var(--color-border)',
                                    position: 'relative', transition: 'background 0.25s ease',
                                    flexShrink: 0
                                }}>
                                    <div style={{
                                        width: '16px', height: '16px', borderRadius: '50%',
                                        background: '#fff',
                                        position: 'absolute', top: '2px',
                                        left: isOn ? '18px' : '2px',
                                        transition: 'left 0.25s ease',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                                    }} />
                                </div>
                                {/* Platform dot + label */}
                                <div style={{
                                    width: '8px', height: '8px', borderRadius: '50%',
                                    background: isOn ? info.color : '#555',
                                    boxShadow: isOn ? `0 0 6px ${info.color}` : 'none',
                                    flexShrink: 0
                                }} />
                                <span style={{
                                    fontSize: '12px', fontWeight: 700,
                                    color: isOn ? info.color : 'var(--color-text-secondary)',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {info.label}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Active count hint */}
                {activeCount === 0 && (
                    <div style={{
                        fontSize: '12px', color: '#FF6B6B', fontWeight: 600,
                        marginBottom: '12px', textAlign: 'center'
                    }}>
                        ⚠️ Enable at least one platform to perform an action
                    </div>
                )}

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button onClick={handleFindDuplicates} disabled={loading !== null || activeCount === 0}
                        style={btnStyle('linear-gradient(135deg,#6C63FF,#8B5CF6)', '0 4px 15px rgba(108,99,255,0.4)')}>
                        {loading === 'find' ? <Spinner /> : '🔍'} Find Duplicate
                    </button>
                    <button onClick={handleDeleteDuplicates} disabled={loading !== null || activeCount === 0}
                        style={btnStyle('linear-gradient(135deg,#FF6B6B,#ee5a5a)', '0 4px 15px rgba(255,107,107,0.4)')}>
                        {loading === 'delete' ? <Spinner /> : '🗑️'} Delete Duplicate
                    </button>
                    <button onClick={handleMissingFiles} disabled={loading !== null || activeCount === 0}
                        style={btnStyle('linear-gradient(135deg,#00D9A3,#00b88a)', '0 4px 15px rgba(0,217,163,0.4)')}>
                        {loading === 'missing' ? <Spinner /> : '📋'} Missing Files
                    </button>
                </div>

                {/* Progress bar — shown during any operation */}
                {loading && (
                    <ProgressPanel label={loadingLabel} progress={progress} />
                )}
            </div>

            {modal?.type === 'find' && (
                <Modal title="🔍 Duplicate Files Report" subtitle="Same filename on the same platform" onClose={() => setModal(null)}>
                    {renderFindModal(modal.data)}
                </Modal>
            )}
            {modal?.type === 'delete' && (
                <Modal title="🗑️ Delete Duplicate Results" onClose={() => setModal(null)}>
                    {renderDeleteModal(modal.data)}
                </Modal>
            )}
            {modal?.type === 'missing' && (
                <Modal title="📋 Missing Files Report" subtitle="Files not present on all 4 platforms" onClose={() => setModal(null)}>
                    {renderMissingModal(modal.data)}
                </Modal>
            )}
        </>
    );
}

import React, { useEffect, useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { renameBatch, getRenameStatus } from '../../services/api';
import Button from '../common/Button';
import { toast } from 'react-toastify';

const PAGE_SIZE = 20;

export default function RightBox() {
    const { files, renameProgress, updateRenameProgress, fetchStats, currentPage, setCurrentPage } = useApp();
    const [newNames, setNewNames] = useState([]);
    const pollRef = useRef(null);

    // All files
    const allFiles = files?.original || [];
    const pageFiles = allFiles.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
    const totalPages = Math.ceil(allFiles.length / PAGE_SIZE);

    // Reset names whenever page or files change
    useEffect(() => {
        setNewNames(pageFiles.map(f => f?.filename || ''));
    }, [currentPage, files.original]);

    // Cleanup polling on unmount
    useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

    const handleNameChange = (index, value) => {
        const updated = [...newNames];
        updated[index] = value;
        setNewNames(updated);
    };

    const handleGoRename = async () => {
        const emptyNames = newNames.filter(name => !name || name.trim() === '');
        if (emptyNames.length > 0) {
            toast.error('❌ Please fill in all rename fields');
            return;
        }

        updateRenameProgress({ isProcessing: true, status: 'processing', currentFile: 0, totalFiles: pageFiles.length });

        try {
            // Start job — responds instantly with jobId
            const { jobId, totalFiles } = await renameBatch(pageFiles, newNames);
            toast.info(`🚀 Renaming ${totalFiles} files on page ${currentPage + 1}…`);

            // Poll every 2 seconds for progress
            pollRef.current = setInterval(async () => {
                try {
                    const job = await getRenameStatus(jobId);

                    updateRenameProgress({
                        isProcessing: job.status === 'running',
                        status: job.status,
                        currentFile: job.currentFile || 0,
                        totalFiles: job.totalFiles || totalFiles
                    });

                    if (job.status === 'completed') {
                        clearInterval(pollRef.current);
                        toast.success(`✅ Page ${currentPage + 1} done! ${job.successful} renamed, ${job.failed} failed`);
                        await fetchStats();
                    } else if (job.status === 'error') {
                        clearInterval(pollRef.current);
                        toast.error(`❌ Rename failed: ${job.error}`);
                        updateRenameProgress({ isProcessing: false, status: 'error' });
                    }
                } catch (pollErr) {
                    clearInterval(pollRef.current);
                    toast.error(`❌ Lost connection to rename job`);
                    updateRenameProgress({ isProcessing: false, status: 'error' });
                }
            }, 2000);

        } catch (error) {
            toast.error(`❌ ${error.message}`);
            updateRenameProgress({ isProcessing: false, status: 'error' });
        }
    };

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            const lines = text.split('\n').filter(line => line.trim());
            const updated = [...newNames];
            lines.forEach((line, index) => {
                if (index < updated.length) updated[index] = line.trim();
            });
            setNewNames(updated);
            toast.success('📋 Pasted names successfully!');
        } catch {
            toast.error('❌ Failed to paste from clipboard');
        }
    };

    const handleClearAll = () => {
        setNewNames(pageFiles.map(f => f.filename));
        toast.info('🔄 Reset to original names');
    };

    const hasFiles = pageFiles.length > 0;

    return (
        <div className="flex-1">
            <div className="glass-card p-4 sm:p-6">
                {/* Header */}
                <div className="mb-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-4">
                        ✏️ Renamed Files
                    </h2>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 sm:gap-3 mb-4">
                        <Button
                            onClick={handleGoRename}
                            variant="green"
                            loading={renameProgress.isProcessing}
                            disabled={!hasFiles}
                            icon="🚀"
                            className="flex-1 min-w-[110px]"
                        >
                            Go Rename
                        </Button>

                        <Button onClick={handlePaste} variant="purple" disabled={!hasFiles} icon="📋" className="min-w-[80px]">
                            Paste
                        </Button>

                        <Button onClick={handleClearAll} variant="purple" disabled={!hasFiles} icon="🔄" className="min-w-[80px]">
                            Reset
                        </Button>
                    </div>

                    {/* Progress Bar */}
                    {renameProgress.isProcessing && (
                        <div className="mb-4">
                            <div className="flex justify-between text-sm text-text-secondary mb-2">
                                <span>Processing...</span>
                                <span>{renameProgress.currentFile} / {renameProgress.totalFiles}</span>
                            </div>
                            <div className="w-full bg-primary-bg rounded-full h-2">
                                <div
                                    className="bg-gradient-to-r from-accent-green to-accent-purple h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${(renameProgress.currentFile / renameProgress.totalFiles) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Page info */}
                    {hasFiles && (
                        <div className="text-text-secondary text-sm mb-3">
                            Page {currentPage + 1} of {totalPages} — {pageFiles.length} files
                        </div>
                    )}
                </div>

                {/* Input List */}
                <div className="max-h-[520px] overflow-y-auto space-y-2">
                    {!hasFiles ? (
                        <div className="text-center py-20 text-text-secondary">
                            <div className="text-6xl mb-4">✏️</div>
                            <p>Fetch files to start renaming</p>
                        </div>
                    ) : (
                        newNames.map((name, index) => (
                            <div key={index} className="relative">
                                <div className="flex items-center gap-2">
                                    <span className="text-text-secondary text-sm font-mono w-10">
                                        {currentPage * PAGE_SIZE + index + 1}.
                                    </span>
                                    <input
                                        type="text"
                                        value={name || ''}
                                        onChange={(e) => handleNameChange(index, e.target.value)}
                                        disabled={renameProgress.isProcessing}
                                        className="flex-1 px-4 py-3 bg-primary-bg border border-primary-border rounded-lg text-text-primary focus:border-accent-purple transition-all disabled:opacity-50"
                                        placeholder="Enter new filename..."
                                    />
                                    <span className="text-text-secondary text-xs w-16 text-right">
                                        {(name || '').length} chars
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-primary-border">
                        <Button
                            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                            variant="purple"
                            disabled={currentPage === 0 || renameProgress.isProcessing}
                            icon="←"
                            className="min-w-[100px]"
                        >
                            Prev 20
                        </Button>

                        <span className="text-text-secondary text-sm font-mono">
                            {currentPage + 1} / {totalPages}
                        </span>

                        <Button
                            onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                            variant="purple"
                            disabled={currentPage >= totalPages - 1 || renameProgress.isProcessing}
                            icon="→"
                            className="min-w-[100px]"
                        >
                            Next 20
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { renameBatch } from '../../services/api';
import Button from '../common/Button';
import { toast } from 'react-toastify';

export default function RightBox() {
    const { files, renameProgress, updateRenameProgress, fetchStats } = useApp();
    const [newNames, setNewNames] = useState([]);

    // Initialize new names when files change
    useEffect(() => {
        if (files?.original?.length > 0) {
            setNewNames(files.original.map(f => f?.filename || ''));
        }
    }, [files.original]);

    const handleNameChange = (index, value) => {
        const updated = [...newNames];
        updated[index] = value;
        setNewNames(updated);
    };

    const handleGoRename = async () => {
        // Validation
        const emptyNames = newNames.filter(name => !name || name.trim() === '');
        if (emptyNames.length > 0) {
            toast.error('❌ Please fill in all rename fields');
            return;
        }

        updateRenameProgress({
            isProcessing: true,
            status: 'processing',
            currentFile: 0,
            totalFiles: files.original.length
        });

        try {
            const response = await renameBatch(files.original, newNames);

            if (response.success) {
                updateRenameProgress({
                    isProcessing: false,
                    status: 'completed'
                });

                toast.success(
                    `✅ Rename complete! ${response.results.successful} successful, ${response.results.failed} failed`
                );

                // Refresh stats
                await fetchStats();
            }
        } catch (error) {
            toast.error(`❌ ${error.message}`);
            updateRenameProgress({
                isProcessing: false,
                status: 'error'
            });
        }
    };

    const handleClearAll = () => {
        const safeOriginal = files?.original || [];
        setNewNames(safeOriginal.map(f => f.filename));
        toast.info('🔄 All fields reset to original names');
    };

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            const lines = text.split('\n').filter(line => line.trim());

            const updated = [...newNames];
            lines.forEach((line, index) => {
                if (index < updated.length) {
                    updated[index] = line.trim();
                }
            });

            setNewNames(updated);
            toast.success('📋 Pasted names successfully!');
        } catch (error) {
            toast.error('❌ Failed to paste from clipboard');
        }
    };

    const hasFiles = files?.original && files.original.length > 0;

    return (
        <div className="flex-1">
            <div className="glass-card p-6">
                {/* Header */}
                <div className="mb-4">
                    <h2 className="text-2xl font-bold text-text-primary mb-4">
                        ✏️ Renamed Files
                    </h2>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mb-4">
                        <Button
                            onClick={handleGoRename}
                            variant="green"
                            loading={renameProgress.isProcessing}
                            disabled={!hasFiles}
                            icon="🚀"
                            className="flex-1"
                        >
                            Go Rename
                        </Button>

                        <Button
                            onClick={handlePaste}
                            variant="purple"
                            disabled={!hasFiles}
                            icon="📋"
                        >
                            Paste
                        </Button>

                        <Button
                            onClick={handleClearAll}
                            variant="purple"
                            disabled={!hasFiles}
                            icon="🔄"
                        >
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
                                    style={{
                                        width: `${(renameProgress.currentFile / renameProgress.totalFiles) * 100}%`
                                    }}
                                ></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input List */}
                <div className="max-h-[600px] overflow-y-auto space-y-2">
                    {!hasFiles ? (
                        <div className="text-center py-20 text-text-secondary">
                            <div className="text-6xl mb-4">✏️</div>
                            <p>Fetch files to start renaming</p>
                        </div>
                    ) : (
                        (newNames || []).map((name, index) => (
                            <div key={index} className="relative">
                                <div className="flex items-center gap-2">
                                    <span className="text-text-secondary text-sm font-mono w-10">
                                        {index + 1}.
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
            </div>
        </div>
    );
}

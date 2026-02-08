import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { fetchFiles } from '../../services/api';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-toastify';

export default function LeftBox() {
    const { files, updateFiles, isLoading, setIsLoading } = useApp();
    const [searchQuery, setSearchQuery] = useState('');

    const handleFetchFiles = async () => {
        setIsLoading(true);
        try {
            const response = await fetchFiles();
            if (response.success) {
                updateFiles(response.files || []);
                toast.success(`✅ Fetched ${response.count} files (SKYFLIX files excluded)`);
            }
        } catch (error) {
            toast.error(`❌ ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyAll = () => {
        const allFilenames = (files?.original || []).map(f => f.filename).join('\n');
        navigator.clipboard.writeText(allFilenames);
        toast.success('📋 All filenames copied to clipboard!');
    };

    const filteredFiles = (files?.original || []).filter(file =>
        file && file.filename && file.filename.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getPlatformBadgeText = (platform) => {
        const map = {
            'rpmshare': 'RPM',
            'streamp2p': 'P2P',
            'seekstreaming': 'SEEK',
            'upnshare': 'UPN'
        };
        return map[platform] || platform.substring(0, 3).toUpperCase();
    };

    const hasFiles = files?.original && files.original.length > 0;

    return (
        <div className="flex-1">
            <div className="glass-card p-6">
                {/* Header */}
                <div className="mb-4">
                    <h2 className="text-2xl font-bold text-text-primary mb-4">
                        📄 Original Files
                    </h2>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mb-4">
                        <Button
                            onClick={handleFetchFiles}
                            variant="purple"
                            loading={isLoading}
                            icon="🔄"
                            className="flex-1"
                        >
                            Fetch All Files
                        </Button>

                        <Button
                            onClick={handleCopyAll}
                            variant="purple"
                            disabled={!hasFiles}
                            icon="📋"
                        >
                            Copy All
                        </Button>
                    </div>

                    {/* Search */}
                    <input
                        type="text"
                        placeholder="🔍 Search files..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2 bg-primary-bg border border-primary-border rounded-lg text-text-primary placeholder-text-secondary focus:border-accent-purple transition-all"
                    />
                </div>

                {/* File Count */}
                {hasFiles && (
                    <div className="mb-3 text-text-secondary text-sm">
                        {filteredFiles.length} of {files.original.length} files
                    </div>
                )}

                {/* File List */}
                <div className="max-h-[600px] overflow-y-auto space-y-2">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <LoadingSpinner size="large" />
                            <p className="text-text-secondary mt-4">Fetching files from all platforms...</p>
                        </div>
                    ) : filteredFiles.length === 0 ? (
                        <div className="text-center py-20 text-text-secondary">
                            {!hasFiles ? (
                                <>
                                    <div className="text-6xl mb-4">📂</div>
                                    <p>No files loaded yet</p>
                                    <p className="text-sm mt-2">Click "Fetch All Files" to get started</p>
                                </>
                            ) : (
                                <p>No files match your search</p>
                            )}
                        </div>
                    ) : (
                        filteredFiles.map((file, index) => (
                            <div
                                key={index}
                                className="bg-primary-bg p-4 rounded-lg hover:bg-[#252538] transition-all border border-transparent hover:border-accent-purple group"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-text-secondary text-sm font-mono">
                                                {index + 1}.
                                            </span>
                                            <span className="text-text-primary font-medium break-all">
                                                {file.filename}
                                            </span>
                                        </div>
                                        {file.size && (
                                            <div className="text-text-secondary text-xs mt-1">
                                                Size: {(file.size / (1024 * 1024)).toFixed(2)} MB
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-1 ml-4">
                                        {file.platforms && Array.isArray(file.platforms) && file.platforms.map((p, i) => (
                                            <div
                                                key={i}
                                                className={`platform-badge ${p.platform === 'rpmshare' ? 'rpm' :
                                                        p.platform === 'streamp2p' ? 'stream' :
                                                            p.platform === 'seekstreaming' ? 'seek' :
                                                                p.platform === 'upnshare' ? 'upn' : 'seek'
                                                    }`}
                                                title={p.platform}
                                            >
                                                {getPlatformBadgeText(p.platform)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { fetchFiles } from '../../services/api';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-toastify';

const PAGE_SIZE = 20;

export default function LeftBox() {
    const { files, updateFiles, isLoading, setIsLoading, currentPage, setCurrentPage } = useApp();
    const [searchQuery, setSearchQuery] = useState('');

    const handleFetchFiles = async () => {
        setIsLoading(true);
        try {
            const response = await fetchFiles();
            if (response.success) {
                updateFiles(response.files || []);
                setCurrentPage(0); // Reset to first page on new fetch
                toast.success(`✅ Fetched ${response.count} files`);
            }
        } catch (error) {
            toast.error(`❌ ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const allFiles = files?.original || [];
    const filteredFiles = allFiles.filter(file =>
        file && file.filename && file.filename.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalPages = Math.ceil(filteredFiles.length / PAGE_SIZE);
    const pageFiles = filteredFiles.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
    const startNum = currentPage * PAGE_SIZE + 1;
    const endNum = Math.min((currentPage + 1) * PAGE_SIZE, filteredFiles.length);

    const handleCopyPage = () => {
        const names = pageFiles.map(f => f.filename).join('\n');
        navigator.clipboard.writeText(names);
        toast.success(`📋 Copied ${pageFiles.length} filenames (page ${currentPage + 1})`);
    };

    const getPlatformBadgeText = (platform) => {
        const map = { rpmshare: 'RPM', streamp2p: 'P2P', seekstreaming: 'SEEK', upnshare: 'UPN' };
        return map[platform] || platform.substring(0, 3).toUpperCase();
    };

    const hasFiles = allFiles.length > 0;

    return (
        <div className="flex-1">
            <div className="glass-card p-4 sm:p-6">
                {/* Header */}
                <div className="mb-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-4">
                        📄 Original Files
                    </h2>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3 mb-4">
                        <Button
                            onClick={handleFetchFiles}
                            variant="purple"
                            loading={isLoading}
                            icon="🔄"
                            className="flex-1 min-w-[130px]"
                        >
                            Fetch All Files
                        </Button>

                        <Button
                            onClick={handleCopyPage}
                            variant="purple"
                            disabled={!hasFiles}
                            icon="📋"
                            className="min-w-[100px]"
                        >
                            Copy Page
                        </Button>
                    </div>

                    {/* Search */}
                    <input
                        type="text"
                        placeholder="🔍 Search files..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(0); }}
                        className="w-full px-4 py-2 bg-primary-bg border border-primary-border rounded-lg text-text-primary placeholder-text-secondary focus:border-accent-purple transition-all"
                    />
                </div>

                {/* File Count + Pagination Info */}
                {hasFiles && (
                    <div className="flex items-center justify-between mb-3 text-text-secondary text-sm">
                        <span>Showing {startNum}–{endNum} of {filteredFiles.length} files</span>
                        <span>Page {currentPage + 1} / {totalPages}</span>
                    </div>
                )}

                {/* File List */}
                <div className="max-h-[520px] overflow-y-auto space-y-2">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <LoadingSpinner size="large" />
                            <p className="text-text-secondary mt-4">Fetching files from all platforms...</p>
                        </div>
                    ) : pageFiles.length === 0 ? (
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
                        pageFiles.map((file, index) => (
                            <div
                                key={index}
                                className="bg-primary-bg p-4 rounded-lg hover:bg-[#252538] transition-all border border-transparent hover:border-accent-purple group"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-text-secondary text-sm font-mono">
                                                {startNum + index}.
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

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-primary-border">
                        <Button
                            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                            variant="purple"
                            disabled={currentPage === 0}
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
                            disabled={currentPage >= totalPages - 1}
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

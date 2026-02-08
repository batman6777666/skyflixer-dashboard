import React from 'react';

export default function Header() {
    const platforms = [
        { name: 'RPMShare', status: 'connected', color: 'bg-blue-500' },
        { name: 'StreamP2P', status: 'connected', color: 'bg-purple-500' },
        { name: 'SeekStreaming', status: 'connected', color: 'bg-green-500' },
        { name: 'UPnShare', status: 'connected', color: 'bg-orange-500' }
    ];

    return (
        <header className="bg-primary-secondary border-b border-primary-border py-6 px-8 mb-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between">
                    {/* Title */}
                    <div>
                        <h1 className="text-4xl font-bold text-text-primary mb-2 bg-gradient-to-r from-accent-purple to-accent-green bg-clip-text text-transparent">
                            🎬 Video Rename Manager
                        </h1>
                        <p className="text-text-secondary text-sm">
                            Multi-platform video hosting file renaming dashboard
                        </p>
                    </div>

                    {/* Platform Status Indicators */}
                    <div className="flex gap-4">
                        {platforms.map((platform) => (
                            <div
                                key={platform.name}
                                className="flex items-center gap-2 glass-card px-4 py-2"
                            >
                                <div className={`w-3 h-3 rounded-full ${platform.color} animate-pulse`}></div>
                                <span className="text-text-primary text-sm font-medium">
                                    {platform.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </header>
    );
}

import React from 'react';
import StatsCards from './StatsCards';
import ActivityLog from './ActivityLog';
import DuplicateTools from './DuplicateTools';
import UploadBox from './UploadBox';

export default function Dashboard() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-8 mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mb-6">
                📊 Dashboard &amp; Statistics
            </h2>

            <UploadBox />
            <DuplicateTools />
            <StatsCards />
            <ActivityLog />
        </div>
    );
}

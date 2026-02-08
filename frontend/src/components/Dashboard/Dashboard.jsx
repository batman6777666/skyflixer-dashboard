import React from 'react';
import StatsCards from './StatsCards';
import ActivityLog from './ActivityLog';

export default function Dashboard() {
    return (
        <div className="max-w-7xl mx-auto px-8 mb-12">
            <h2 className="text-3xl font-bold text-text-primary mb-6">
                📊 Dashboard & Statistics
            </h2>

            <StatsCards />
            <ActivityLog />
        </div>
    );
}

import React from 'react';
import { useApp } from '../../context/AppContext';

export default function StatsCards() {
    const { stats } = useApp();

    const cards = [
        {
            title: "Today's Renames",
            value: stats?.today?.count || 0,
            icon: '📅',
            color: 'purple',
            subtext: `${stats?.today?.successful || 0} successful`
        },
        {
            title: 'Last 24 Hours',
            value: stats?.last24h?.count || 0,
            icon: '🕐',
            color: 'blue',
            subtext: `${stats?.last24h?.successful || 0} successful`
        },
        {
            title: 'Total Files Fetched',
            value: stats?.totalFetched || 0,
            icon: '📊',
            color: 'green',
            subtext: 'Current session'
        },
        {
            title: 'Success Rate',
            value: `${stats?.successRate || 0}%`,
            icon: '✅',
            color: 'gradient',
            subtext: 'Overall performance'
        }
    ];

    const getColorClasses = (color) => {
        const colors = {
            purple: 'border-accent-purple',
            blue: 'border-blue-500',
            green: 'border-accent-green',
            gradient: 'border-accent-purple'
        };
        return colors[color];
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {cards.map((card, index) => (
                <div
                    key={index}
                    className={`glass-card p-6 border-b-4 ${getColorClasses(card.color)} animate-fadeIn`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                >
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <p className="text-text-secondary text-sm font-medium mb-1">
                                {card.title}
                            </p>
                            <h3 className="text-4xl font-bold text-text-primary">
                                {card.value}
                            </h3>
                        </div>
                        <div className="text-4xl">
                            {card.icon}
                        </div>
                    </div>

                    {/* Progress Bar for Success Rate */}
                    {card.title === 'Success Rate' && (
                        <div className="mb-2">
                            <div className="w-full bg-primary-bg rounded-full h-2">
                                <div
                                    className="bg-gradient-to-r from-accent-green to-accent-purple h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${stats?.successRate || 0}%` }}
                                ></div>
                            </div>
                        </div>
                    )}

                    <p className="text-text-secondary text-xs">
                        {card.subtext}
                    </p>
                </div>
            ))}
        </div>
    );
}

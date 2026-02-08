import React from 'react';

export default function LoadingSpinner({ size = 'medium', color = 'purple' }) {
    const sizes = {
        small: 'w-4 h-4',
        medium: 'w-8 h-8',
        large: 'w-12 h-12'
    };

    const colors = {
        purple: 'border-accent-purple',
        green: 'border-accent-green',
        white: 'border-white'
    };

    return (
        <div className="flex items-center justify-center">
            <div className={`
        ${sizes[size]}
        ${colors[color]}
        border-2
        border-t-transparent
        rounded-full
        animate-spin
      `}></div>
        </div>
    );
}

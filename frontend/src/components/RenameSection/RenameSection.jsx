import React from 'react';
import LeftBox from './LeftBox';
import RightBox from './RightBox';

export default function RenameSection() {
    return (
        <div className="max-w-7xl mx-auto px-8 mb-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <LeftBox />
                <RightBox />
            </div>
        </div>
    );
}

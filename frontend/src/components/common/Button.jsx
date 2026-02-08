import React from 'react';

export default function Button({
    children,
    onClick,
    variant = 'purple',
    loading = false,
    disabled = false,
    icon = null,
    className = ''
}) {
    const variants = {
        purple: 'bg-gradient-to-r from-accent-purple to-[#5B54E8] shadow-purple hover:brightness-110',
        green: 'bg-gradient-to-r from-accent-green to-[#00BF8F] shadow-green hover:brightness-110'
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled || loading}
            className={`
        ${variants[variant]}
        px-8 py-3
        rounded-lg
        font-semibold
        text-text-primary
        btn-hover
        disabled:opacity-50
        disabled:cursor-not-allowed
        flex items-center gap-2 justify-center
        transition-all duration-200
        ${className}
      `}
        >
            {loading ? (
                <>
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Processing...</span>
                </>
            ) : (
                <>
                    {icon && <span>{icon}</span>}
                    {children}
                </>
            )}
        </button>
    );
}

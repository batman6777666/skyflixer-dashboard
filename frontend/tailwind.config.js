/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: ['selector', '[data-theme="dark"]'],
    theme: {
        extend: {
            colors: {
                primary: {
                    bg: 'var(--color-primary-bg)',
                    secondary: 'var(--color-secondary-bg)',
                    border: 'var(--color-border)'
                },
                accent: {
                    purple: 'var(--color-accent-purple)',
                    purpleDark: '#5B54E8',
                    green: 'var(--color-accent-green)',
                    greenDark: '#00BF8F',
                    red: 'var(--color-accent-red)'
                },
                text: {
                    primary: 'var(--color-text-primary)',
                    secondary: 'var(--color-text-secondary)'
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif']
            },
            borderRadius: {
                'custom': '8px',
                'card': '12px'
            },
            boxShadow: {
                'purple': '0 4px 15px rgba(108, 99, 255, 0.3)',
                'green': '0 4px 15px rgba(0, 217, 163, 0.3)',
                'glow': '0 0 20px rgba(108, 99, 255, 0.2)'
            }
        },
    },
    plugins: [],
}

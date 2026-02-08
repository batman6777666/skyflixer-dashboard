/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    bg: '#0f0f23',
                    secondary: '#1a1a2e',
                    border: '#2D2D44'
                },
                accent: {
                    purple: '#6C63FF',
                    purpleDark: '#5B54E8',
                    green: '#00D9A3',
                    greenDark: '#00BF8F',
                    red: '#FF6B6B'
                },
                text: {
                    primary: '#FFFFFF',
                    secondary: '#B8B8D0'
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

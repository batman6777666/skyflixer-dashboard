import React, { useState, useEffect } from 'react';
import { AppProvider } from './context/AppContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/darkTheme.css';

import Header from './components/Header';
import RenameSection from './components/RenameSection/RenameSection';
import Dashboard from './components/Dashboard/Dashboard';

function App() {
    const [theme, setTheme] = useState(() =>
        localStorage.getItem('theme') || 'dark'
    );

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

    return (
        <AppProvider>
            <div style={{ minHeight: '100vh', background: 'var(--color-primary-bg)', transition: 'background 0.3s ease' }}>
                <Header theme={theme} toggleTheme={toggleTheme} />
                <main>
                    <RenameSection />
                    <Dashboard />
                </main>

                <ToastContainer
                    position="top-right"
                    autoClose={4000}
                    hideProgressBar={false}
                    newestOnTop
                    closeOnClick
                    pauseOnHover
                    theme={theme === 'dark' ? 'dark' : 'light'}
                    style={{ zIndex: 99999 }}
                />
            </div>
        </AppProvider>
    );
}

export default App;

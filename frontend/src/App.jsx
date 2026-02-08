import React from 'react';
import { AppProvider } from './context/AppContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/darkTheme.css';

import Header from './components/Header';
import RenameSection from './components/RenameSection/RenameSection';
import Dashboard from './components/Dashboard/Dashboard';

function App() {
    return (
        <AppProvider>
            <div className="min-h-screen bg-primary-bg">
                <Header />
                <main>
                    <RenameSection />
                    <Dashboard />
                </main>

                {/* Toast Notifications */}
                <ToastContainer
                    position="top-right"
                    autoClose={5000}
                    hideProgressBar={false}
                    newestOnTop
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                    theme="dark"
                    style={{ zIndex: 99999 }}
                    toastStyle={{ backgroundColor: '#1a1a2e', color: '#fff' }}
                />
            </div>
        </AppProvider>
    );
}

export default App;

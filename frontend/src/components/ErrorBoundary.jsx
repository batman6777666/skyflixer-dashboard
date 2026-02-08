import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.state = { hasError: true, error, errorInfo };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: '100vh',
                    background: '#0f0f23',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                    fontFamily: 'Inter, sans-serif'
                }}>
                    <div style={{
                        maxWidth: '600px',
                        background: '#1a1a2e',
                        padding: '40px',
                        borderRadius: '12px',
                        border: '1px solid #2D2D44'
                    }}>
                        <h1 style={{ fontSize: '32px', marginBottom: '20px', color: '#FF6B6B' }}>
                            ⚠️ Something went wrong
                        </h1>
                        <p style={{ marginBottom: '20px', color: '#B8B8D0' }}>
                            The application encountered an error and couldn't continue. Please try refreshing the page.
                        </p>
                        <details open style={{
                            background: '#0f0f23',
                            padding: '15px',
                            borderRadius: '8px',
                            marginBottom: '20px',
                            fontSize: '14px'
                        }}>
                            <summary style={{ cursor: 'pointer', marginBottom: '10px', color: '#6C63FF' }}>
                                Error Details (Click to expand)
                            </summary>
                            <pre style={{
                                whiteSpace: 'pre-wrap',
                                color: '#FF6B6B',
                                fontSize: '12px',
                                margin: '10px 0'
                            }}>
                                {this.state.error && this.state.error.toString()}
                            </pre>
                            <pre style={{
                                whiteSpace: 'pre-wrap',
                                color: '#B8B8D0',
                                fontSize: '11px',
                                maxHeight: '200px',
                                overflow: 'auto'
                            }}>
                                {this.state.errorInfo && this.state.errorInfo.componentStack}
                            </pre>
                        </details>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                background: 'linear-gradient(135deg, #6C63FF 0%, #5B54E8 100%)',
                                color: 'white',
                                border: 'none',
                                padding: '12px 24px',
                                borderRadius: '8px',
                                fontSize: '16px',
                                cursor: 'pointer',
                                fontWeight: '600'
                            }}
                        >
                            🔄 Reload Application
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

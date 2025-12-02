import React, { useEffect, useState } from 'react';
import { useGoalStore } from '../store/goalStore';

export const WhoopCallback: React.FC = () => {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { connectWhoop, currentUser } = useGoalStore();

  useEffect(() => {
    const handleCallback = async () => {
      // Get the authorization code from URL
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');
      const errorDescription = urlParams.get('error_description');

      if (error) {
        setStatus('error');
        setErrorMessage(errorDescription || error);
        return;
      }

      if (!code) {
        setStatus('error');
        setErrorMessage('No authorization code received');
        return;
      }

      if (!currentUser) {
        setStatus('error');
        setErrorMessage('Please sign in first');
        return;
      }

      try {
        await connectWhoop(code);
        setStatus('success');

        // Redirect back to main app after short delay
        setTimeout(() => {
          window.location.href = '/visionquest/';
        }, 1500);
      } catch (err) {
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'Failed to connect WHOOP');
      }
    };

    handleCallback();
  }, [connectWhoop, currentUser]);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F5F5F5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        padding: '40px 32px',
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center',
      }}>
        {status === 'processing' && (
          <>
            <div style={{
              width: '56px',
              height: '56px',
              border: '3px solid #E5E7EB',
              borderTopColor: '#3B82F6',
              borderRadius: '50%',
              margin: '0 auto 24px',
              animation: 'spin 1s linear infinite',
            }} />
            <h2 style={{
              fontSize: '20px',
              fontWeight: 600,
              color: '#0F172A',
              margin: '0 0 8px 0',
            }}>Connecting WHOOP</h2>
            <p style={{
              fontSize: '14px',
              color: '#64748B',
              margin: 0,
            }}>Please wait while we complete the connection...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{
              width: '56px',
              height: '56px',
              backgroundColor: '#DCFCE7',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <svg width="28" height="28" fill="none" stroke="#22C55E" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 style={{
              fontSize: '20px',
              fontWeight: 600,
              color: '#0F172A',
              margin: '0 0 8px 0',
            }}>WHOOP Connected!</h2>
            <p style={{
              fontSize: '14px',
              color: '#64748B',
              margin: 0,
            }}>Redirecting you back to Vision Quest...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{
              width: '56px',
              height: '56px',
              backgroundColor: '#FEE2E2',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <svg width="28" height="28" fill="none" stroke="#EF4444" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 style={{
              fontSize: '20px',
              fontWeight: 600,
              color: '#0F172A',
              margin: '0 0 12px 0',
            }}>Connection Failed</h2>
            <p style={{
              fontSize: '14px',
              color: '#EF4444',
              margin: '0 0 24px 0',
              padding: '12px',
              backgroundColor: '#FEF2F2',
              borderRadius: '8px',
              wordBreak: 'break-word',
            }}>{errorMessage}</p>
            <button
              onClick={() => window.location.href = '/visionquest/'}
              style={{
                padding: '12px 24px',
                backgroundColor: '#F1F5F9',
                color: '#1F2937',
                borderRadius: '8px',
                border: 'none',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E2E8F0'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
            >
              Return to Vision Quest
            </button>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

import React from 'react';
import { useGoalStore } from '../store/goalStore';
import { getAuthUrl, isWhoopConfigured } from '../services/whoop';

export const WhoopSettings: React.FC = () => {
  const {
    whoopConnected,
    whoopLastSync,
    whoopSyncing,
    syncWhoopData,
    disconnectWhoop,
  } = useGoalStore();

  const handleConnect = () => {
    if (!isWhoopConfigured()) {
      alert('WHOOP API credentials not configured. Please add VITE_WHOOP_CLIENT_ID and VITE_WHOOP_CLIENT_SECRET to your .env file.');
      return;
    }

    // Generate a random state for CSRF protection (must be at least 8 characters)
    const state = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
    sessionStorage.setItem('whoop_oauth_state', state);

    // Redirect to WHOOP authorization
    window.location.href = getAuthUrl(state);
  };

  const handleDisconnect = async () => {
    if (confirm('Are you sure you want to disconnect WHOOP?')) {
      await disconnectWhoop();
    }
  };

  const handleSync = async () => {
    try {
      await syncWhoopData();
    } catch (error) {
      console.error('Sync failed:', error);
      alert('Failed to sync WHOOP data. Please try again.');
    }
  };

  const formatLastSync = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div style={{
      backgroundColor: '#FAFAFA',
      borderRadius: '10px',
      border: '1px solid #E5E7EB',
      padding: '16px',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: whoopConnected ? '16px' : '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* WHOOP Logo */}
          <div style={{
            width: '40px',
            height: '40px',
            backgroundColor: '#000',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{ color: 'white', fontWeight: 700, fontSize: '14px' }}>W</span>
          </div>
          <div>
            <h3 style={{
              fontWeight: 600,
              color: '#0F172A',
              fontSize: '15px',
              margin: 0,
              marginBottom: '2px'
            }}>WHOOP</h3>
            <p style={{
              fontSize: '13px',
              color: whoopConnected ? '#10B981' : '#64748B',
              margin: 0,
              fontWeight: 500
            }}>
              {whoopConnected ? 'Connected' : 'Not connected'}
            </p>
          </div>
        </div>

        {/* Connection status indicator */}
        <div style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          backgroundColor: whoopConnected ? '#10B981' : '#D1D5DB',
        }} />
      </div>

      {whoopConnected ? (
        <>
          {/* Sync info */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '12px 14px',
            marginBottom: '12px',
            border: '1px solid #E5E7EB',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '13px',
            }}>
              <span style={{ color: '#64748B' }}>Last synced</span>
              <span style={{ color: '#1F2937', fontWeight: 500 }}>{formatLastSync(whoopLastSync)}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleSync}
              disabled={whoopSyncing}
              style={{
                flex: 1,
                padding: '10px 16px',
                backgroundColor: whoopSyncing ? '#93C5FD' : '#3B82F6',
                color: 'white',
                borderRadius: '8px',
                border: 'none',
                fontSize: '14px',
                fontWeight: 500,
                cursor: whoopSyncing ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => !whoopSyncing && (e.currentTarget.style.backgroundColor = '#2563EB')}
              onMouseLeave={(e) => !whoopSyncing && (e.currentTarget.style.backgroundColor = '#3B82F6')}
            >
              {whoopSyncing ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }} />
                  Syncing...
                </>
              ) : (
                <>
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Sync Now
                </>
              )}
            </button>
            <button
              onClick={handleDisconnect}
              style={{
                padding: '10px 16px',
                backgroundColor: 'white',
                color: '#64748B',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#FEE2E2';
                e.currentTarget.style.borderColor = '#FECACA';
                e.currentTarget.style.color = '#DC2626';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.borderColor = '#E5E7EB';
                e.currentTarget.style.color = '#64748B';
              }}
            >
              Disconnect
            </button>
          </div>
        </>
      ) : (
        <>
          <p style={{
            fontSize: '13px',
            color: '#64748B',
            marginBottom: '16px',
            lineHeight: '1.5',
          }}>
            Connect your WHOOP to automatically sync recovery, strain, and sleep data to your goals.
          </p>
          <button
            onClick={handleConnect}
            style={{
              width: '100%',
              padding: '10px 16px',
              backgroundColor: '#000',
              color: 'white',
              borderRadius: '8px',
              border: 'none',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1F2937'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#000'}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Connect WHOOP
          </button>
        </>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

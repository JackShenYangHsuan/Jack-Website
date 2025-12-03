import React, { useState } from 'react';
import { useGoalStore } from '../store/goalStore';

export const ScreenTimeSettings: React.FC = () => {
  const {
    screenTimeData,
    screenTimeLastSync,
    logScreenTime,
    currentUser,
  } = useGoalStore();

  const [showManualEntry, setShowManualEntry] = useState(false);
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [isLogging, setIsLogging] = useState(false);

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

  const formatMinutes = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  const handleManualLog = async () => {
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    const totalMinutes = h * 60 + m;

    if (totalMinutes <= 0) {
      alert('Please enter a valid Screen Time');
      return;
    }

    setIsLogging(true);
    try {
      await logScreenTime(totalMinutes, 'manual');
      setShowManualEntry(false);
      setHours('');
      setMinutes('');
    } catch (error) {
      console.error('Error logging Screen Time:', error);
      alert('Failed to log Screen Time. Please try again.');
    } finally {
      setIsLogging(false);
    }
  };

  // Generate the Firebase project ID for the Shortcut URL
  const _firebaseProjectId = 'vision-matrix';
  const userId = currentUser?.uid || '[USER_ID]';

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
        marginBottom: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Screen Time Icon */}
          <div style={{
            width: '40px',
            height: '40px',
            backgroundColor: '#8B5CF6',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="20" height="20" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 style={{
              fontWeight: 600,
              color: '#0F172A',
              fontSize: '15px',
              margin: 0,
              marginBottom: '2px'
            }}>Screen Time</h3>
            <p style={{
              fontSize: '13px',
              color: screenTimeData ? '#10B981' : '#64748B',
              margin: 0,
              fontWeight: 500
            }}>
              {screenTimeData ? 'Tracking' : 'Not configured'}
            </p>
          </div>
        </div>

        {/* Status indicator */}
        <div style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          backgroundColor: screenTimeData ? '#10B981' : '#D1D5DB',
        }} />
      </div>

      {screenTimeData ? (
        <>
          {/* Current Screen Time display */}
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
              marginBottom: '8px',
            }}>
              <span style={{ color: '#64748B' }}>Today's Screen Time</span>
              <span style={{ color: '#0F172A', fontWeight: 600, fontSize: '16px' }}>
                {formatMinutes(screenTimeData.minutes)}
              </span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '13px',
            }}>
              <span style={{ color: '#64748B' }}>Last synced</span>
              <span style={{ color: '#1F2937', fontWeight: 500 }}>{formatLastSync(screenTimeLastSync)}</span>
            </div>
          </div>

          {/* Update button */}
          <button
            onClick={() => setShowManualEntry(!showManualEntry)}
            style={{
              width: '100%',
              padding: '10px 16px',
              backgroundColor: showManualEntry ? '#F1F5F9' : '#8B5CF6',
              color: showManualEntry ? '#64748B' : 'white',
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
          >
            {showManualEntry ? 'Cancel' : 'Update Screen Time'}
          </button>
        </>
      ) : (
        <>
          <p style={{
            fontSize: '13px',
            color: '#64748B',
            marginBottom: '16px',
            lineHeight: '1.5',
          }}>
            Track your daily Screen Time to automatically update goal scores. Use the iOS Shortcut or log manually.
          </p>
          <button
            onClick={() => setShowManualEntry(true)}
            style={{
              width: '100%',
              padding: '10px 16px',
              backgroundColor: '#8B5CF6',
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
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7C3AED'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#8B5CF6'}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Log Screen Time
          </button>
        </>
      )}

      {/* Manual Entry Form */}
      {showManualEntry && (
        <div style={{
          marginTop: '12px',
          padding: '12px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #E5E7EB',
        }}>
          <p style={{
            fontSize: '13px',
            color: '#64748B',
            marginBottom: '12px',
          }}>
            Enter your Screen Time from Settings → Screen Time
          </p>
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '12px',
          }}>
            <div style={{ flex: 1 }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                color: '#64748B',
                marginBottom: '4px',
              }}>Hours</label>
              <input
                type="number"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="0"
                min="0"
                max="24"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #E5E7EB',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                color: '#64748B',
                marginBottom: '4px',
              }}>Minutes</label>
              <input
                type="number"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                placeholder="0"
                min="0"
                max="59"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #E5E7EB',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
          <button
            onClick={handleManualLog}
            disabled={isLogging}
            style={{
              width: '100%',
              padding: '10px 16px',
              backgroundColor: isLogging ? '#A78BFA' : '#8B5CF6',
              color: 'white',
              borderRadius: '8px',
              border: 'none',
              fontSize: '14px',
              fontWeight: 500,
              cursor: isLogging ? 'not-allowed' : 'pointer',
            }}
          >
            {isLogging ? 'Saving...' : 'Save'}
          </button>
        </div>
      )}

      {/* How to Find Screen Time Instructions (collapsible) */}
      <details style={{ marginTop: '16px' }}>
        <summary style={{
          fontSize: '13px',
          color: '#64748B',
          cursor: 'pointer',
          padding: '8px 0',
        }}>
          How to find your Screen Time
        </summary>
        <div style={{
          marginTop: '8px',
          padding: '12px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #E5E7EB',
          fontSize: '12px',
          color: '#4B5563',
          lineHeight: '1.6',
        }}>
          <p style={{ marginBottom: '10px', fontWeight: 500 }}>On your iPhone:</p>
          <ol style={{ margin: 0, paddingLeft: '16px', marginBottom: '12px' }}>
            <li style={{ marginBottom: '4px' }}>Open <strong>Settings</strong></li>
            <li style={{ marginBottom: '4px' }}>Tap <strong>Screen Time</strong></li>
            <li style={{ marginBottom: '4px' }}>View "Today" usage at the top</li>
            <li style={{ marginBottom: '4px' }}>Log the total hours and minutes here</li>
          </ol>

          <div style={{
            backgroundColor: '#F0FDF4',
            border: '1px solid #86EFAC',
            borderRadius: '6px',
            padding: '10px',
            marginBottom: '12px',
          }}>
            <p style={{ margin: 0, fontSize: '11px', color: '#166534' }}>
              <strong>Tip:</strong> Set a daily reminder to log your Screen Time at the same time each day for consistent tracking.
            </p>
          </div>

          <div style={{
            backgroundColor: '#EEF2FF',
            border: '1px solid #A5B4FC',
            borderRadius: '6px',
            padding: '10px',
          }}>
            <p style={{ margin: 0, marginBottom: '6px', fontSize: '11px', color: '#3730A3', fontWeight: 500 }}>
              iOS Shortcut (Advanced)
            </p>
            <p style={{ margin: 0, fontSize: '11px', color: '#4338CA' }}>
              Create a Shortcut that opens this web app directly for quick logging:
            </p>
            <ol style={{ margin: '8px 0 0 0', paddingLeft: '16px', fontSize: '11px', color: '#4338CA' }}>
              <li>Open Shortcuts app</li>
              <li>Create new Shortcut</li>
              <li>Add "Open URLs" action</li>
              <li>Set URL to this app's address</li>
              <li>Add to Home Screen</li>
            </ol>
          </div>

          <p style={{ marginTop: '12px', fontSize: '11px', color: '#9CA3AF' }}>
            Your User ID: <code style={{ backgroundColor: '#F1F5F9', padding: '2px 4px', borderRadius: '4px' }}>{userId}</code>
          </p>
        </div>
      </details>
    </div>
  );
};

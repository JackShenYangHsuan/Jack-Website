import React, { useEffect, useState } from 'react';
import { signInWithGoogle, logOut, onAuthStateChange, type User } from '../services/firebase';
import { useGoalStore } from '../store/goalStore';
import { WhoopSettings } from './WhoopSettings';

// Toggle Switch Component
const ToggleSwitch: React.FC<{
  enabled: boolean;
  onToggle: () => void;
  label: string;
  description?: string;
}> = ({ enabled, onToggle, label, description }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 14px',
    backgroundColor: '#FAFAFA',
    borderRadius: '10px',
    border: '1px solid #E5E7EB',
  }}>
    <div>
      <p style={{
        fontSize: '14px',
        fontWeight: 500,
        color: '#0F172A',
        margin: 0,
        marginBottom: description ? '2px' : 0,
      }}>{label}</p>
      {description && (
        <p style={{
          fontSize: '12px',
          color: '#64748B',
          margin: 0,
        }}>{description}</p>
      )}
    </div>
    <button
      onClick={onToggle}
      style={{
        width: '44px',
        height: '24px',
        borderRadius: '12px',
        border: 'none',
        backgroundColor: enabled ? '#3B82F6' : '#D1D5DB',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background-color 0.2s',
        flexShrink: 0,
      }}
    >
      <div style={{
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        backgroundColor: 'white',
        position: 'absolute',
        top: '2px',
        left: enabled ? '22px' : '2px',
        transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  </div>
);

export const Auth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { setCurrentUser, loadUserData, aiSuggestionsEnabled, toggleAiSuggestions } = useGoalStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (authUser) => {
      setUser(authUser);
      setCurrentUser(authUser);

      if (authUser) {
        // Load user's data from Firebase
        await loadUserData(authUser.uid);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Sign in error:', error);
      alert('Failed to sign in. Please try again.');
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
      setCurrentUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      alert('Failed to sign out. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 min-h-screen bg-[#FAFAFA]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#E5E5E5] border-t-[#3B82F6]"></div>
        <p style={{
          fontSize: '15px',
          color: '#64748B',
          fontWeight: 500,
          letterSpacing: '0.3px'
        }}>
          Loading your goals<span className="animate-pulse">...</span>
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#F5F5F5'
      }}>
        <div style={{
          textAlign: 'center',
          maxWidth: '400px',
          padding: '0 24px'
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 600,
            color: '#0F172A',
            marginBottom: '12px'
          }}>
            VISION QUEST
          </h1>
          <p style={{
            fontSize: '15px',
            color: '#64748B',
            marginBottom: '32px'
          }}>
            Become the hero of your story
          </p>

          <button
            onClick={handleSignIn}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              margin: '0 auto',
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              padding: '10px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              color: '#1F2937',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F9FAFB';
              e.currentTarget.style.borderColor = '#3B82F6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.borderColor = '#E5E7EB';
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Fixed Header */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderBottom: '1px solid #E5E7EB',
        zIndex: 50,
        height: '48px'
      }}>
        <div style={{
          position: 'relative',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 16px'
        }}>
          {/* Center: Product Name */}
          <h1 style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '16px',
            fontWeight: 600,
            color: '#0F172A',
            margin: 0,
            whiteSpace: 'nowrap'
          }}>
            VISION QUEST
          </h1>

          {/* Right: Shortcuts + Profile Pic + Sign Out */}
          <div style={{
            position: 'absolute',
            right: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {!isMobile && (
              <>
                <button
                  onClick={() => setShowSettings(true)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#4B5563',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F9FAFB';
                    e.currentTarget.style.color = '#1F2937';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.color = '#4B5563';
                  }}
                >
                  Settings
                </button>
                <button
                  onClick={() => setShowShortcuts(true)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#4B5563',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F9FAFB';
                    e.currentTarget.style.color = '#1F2937';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.color = '#4B5563';
                  }}
                >
                  Shortcuts
                </button>
              </>
            )}
            <button
              onClick={handleSignOut}
              style={{
                padding: '3px 8px',
                fontSize: '13px',
                fontWeight: 500,
                color: '#4B5563',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#F9FAFB';
                e.currentTarget.style.color = '#1F2937';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.color = '#4B5563';
              }}
            >
              Sign Out
            </button>
            {user.photoURL && !imageError ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  border: '1px solid #E5E7EB'
                }}
                onError={() => setImageError(true)}
              />
            ) : (
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  border: '1px solid #E5E7EB',
                  backgroundColor: '#3B82F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 600
                }}
              >
                {user.displayName?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100
          }}
          onClick={() => setShowSettings(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#0F172A', margin: 0 }}>
                Settings
              </h2>
              <button
                onClick={() => setShowSettings(false)}
                style={{
                  padding: '4px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  color: '#64748B',
                  fontSize: '24px',
                  lineHeight: '1'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#64748B', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Features
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <ToggleSwitch
                  enabled={aiSuggestionsEnabled}
                  onToggle={toggleAiSuggestions}
                  label="AI Action Suggestions"
                  description="Auto-generate task suggestions for goals"
                />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#64748B', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Integrations
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <WhoopSettings />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shortcuts Modal */}
      {showShortcuts && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100
          }}
          onClick={() => setShowShortcuts(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#0F172A', margin: 0 }}>
                Keyboard Shortcuts
              </h2>
              <button
                onClick={() => setShowShortcuts(false)}
                style={{
                  padding: '4px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  color: '#64748B',
                  fontSize: '24px',
                  lineHeight: '1'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#64748B', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Navigation
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: '#1F2937' }}>Move to adjacent cell</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <kbd style={{ padding: '2px 8px', backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}>↑</kbd>
                      <kbd style={{ padding: '2px 8px', backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}>↓</kbd>
                      <kbd style={{ padding: '2px 8px', backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}>←</kbd>
                      <kbd style={{ padding: '2px 8px', backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}>→</kbd>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: '#1F2937' }}>Jump 3 cells</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <kbd style={{ padding: '2px 8px', backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}>Shift</kbd>
                      <span style={{ color: '#94A3B8' }}>+</span>
                      <kbd style={{ padding: '2px 8px', backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}>Arrow</kbd>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#64748B', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Editing
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: '#1F2937' }}>Edit selected cell</span>
                    <kbd style={{ padding: '2px 8px', backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}>Enter</kbd>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: '#1F2937' }}>Save edits</span>
                    <kbd style={{ padding: '2px 8px', backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}>Enter</kbd>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: '#1F2937' }}>Exit without saving</span>
                    <kbd style={{ padding: '2px 8px', backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}>Esc</kbd>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: '#1F2937' }}>Adjust score</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <kbd style={{ padding: '2px 8px', backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}>←</kbd>
                      <kbd style={{ padding: '2px 8px', backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}>→</kbd>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content with padding to account for fixed header */}
      <div style={{ paddingTop: '48px' }}>
        {children}
      </div>
    </>
  );
};

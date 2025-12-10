import { useState, useEffect, useRef } from 'react';
import { auth } from '../services/api';
import { saveAuthToken, saveUserEmail } from '../services/localStorage';

function Login({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const callbackProcessed = useRef(false);

  useEffect(() => {
    // Check for OAuth callback code in URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code && !callbackProcessed.current) {
      callbackProcessed.current = true;
      handleOAuthCallback(code);
    }
  }, []);

  const handleOAuthCallback = async (code) => {
    // Prevent duplicate calls (React StrictMode can trigger useEffect twice)
    if (loading) return;

    setLoading(true);
    setError('');

    try {
      const response = await auth.handleCallback(code);
      const { token, user } = response.data;

      // Save auth token and user email
      saveAuthToken(token);
      saveUserEmail(user.email);

      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);

      // Trigger login callback
      onLogin();

    } catch (err) {
      console.error('OAuth callback error:', err);
      setError(err.response?.data?.error?.message || 'Authentication failed');
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await auth.getGoogleAuthUrl();
      const { authUrl } = response.data;

      // Redirect to Google OAuth
      window.location.href = authUrl;

    } catch (err) {
      console.error('Sign in error:', err);
      setError(err.response?.data?.error?.message || 'Failed to initiate sign in');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Gmail Auto-Tagger
          </h1>
          <p className="text-gray-600">
            AI-powered email organization for your inbox
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Welcome
            </h2>
            <p className="text-gray-600">
              Sign in with your Gmail account to get started
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 rounded-lg px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-700"></div>
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                <span>Sign in with Google</span>
              </>
            )}
          </button>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>
              By signing in, you agree to allow this app to access your Gmail
              labels and modify email labels.
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p className="font-semibold mb-2">What you can do:</p>
          <ul className="space-y-1">
            <li>✓ Create tagging rules in plain English</li>
            <li>✓ AI automatically labels your emails</li>
            <li>✓ Your OpenAI API key stays in your browser</li>
            <li>✓ Privacy-first design</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Login;

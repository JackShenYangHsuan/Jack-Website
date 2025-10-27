export default function APISetupPage() {
  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <a href="/" className="text-blue-600 hover:underline">← Back to Home</a>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-5">🔐 API Setup Guide</h1>
        <p className="text-base text-gray-600 mb-6">
          Follow these step-by-step instructions to get all the API credentials you need for DayStory.
        </p>

        <div className="prose prose-base max-w-none">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
            <h3 className="text-base font-semibold text-blue-900 mt-0">📋 Quick Checklist</h3>
            <ul className="text-blue-800 space-y-1.5 text-sm">
              <li>Google OAuth & Calendar API (~15 min)</li>
              <li>OpenAI API Key (~5 min)</li>
              <li>Firebase Setup (~10 min)</li>
              <li>NextAuth Secret (~1 min)</li>
            </ul>
          </div>

          {/* Google OAuth Section */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-3">1️⃣ Google OAuth & Calendar API</h2>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div>
                <h4 className="font-semibold text-gray-900">Step 1: Create Google Cloud Project</h4>
                <ol className="list-decimal list-inside space-y-1.5 text-gray-700 mt-1.5 text-sm">
                  <li>Go to <a href="https://console.cloud.google.com" target="_blank" className="text-blue-600 hover:underline">Google Cloud Console</a></li>
                  <li>Click "Select a project" → "New Project"</li>
                  <li>Name it <strong>"DayStory"</strong></li>
                  <li>Click <strong>"Create"</strong></li>
                </ol>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900">Step 2: Enable Google Calendar API</h4>
                <ol className="list-decimal list-inside space-y-1.5 text-gray-700 mt-1.5 text-sm">
                  <li>Go to "APIs & Services" → "Library"</li>
                  <li>Search for "Google Calendar API"</li>
                  <li>Click on it and press <strong>"Enable"</strong></li>
                </ol>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900">Step 3: Create OAuth Credentials</h4>
                <ol className="list-decimal list-inside space-y-1.5 text-gray-700 mt-1.5 text-sm">
                  <li>Go to "APIs & Services" → "Credentials"</li>
                  <li>Click "Create Credentials" → "OAuth 2.0 Client ID"</li>
                  <li>Choose "Web application"</li>
                  <li>Add redirect URI: <code className="bg-gray-200 px-2 py-1 rounded text-xs">http://localhost:3000/api/auth/callback/google</code></li>
                  <li>Click "Create" and <strong>COPY</strong> your Client ID and Secret</li>
                </ol>
              </div>

              <div className="bg-green-50 border border-green-200 rounded p-3 mt-3">
                <p className="text-xs font-medium text-green-900">✅ You'll get:</p>
                <p className="text-xs text-green-800 mt-1">GOOGLE_CLIENT_ID</p>
                <p className="text-xs text-green-800">GOOGLE_CLIENT_SECRET</p>
              </div>
            </div>
          </section>

          {/* OpenAI Section */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-3">2️⃣ OpenAI API</h2>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <ol className="list-decimal list-inside space-y-1.5 text-gray-700 text-sm">
                <li>Go to <a href="https://platform.openai.com" target="_blank" className="text-blue-600 hover:underline">OpenAI Platform</a></li>
                <li>Sign up or log in</li>
                <li>Click your profile → "View API keys"</li>
                <li>Click "Create new secret key"</li>
                <li><strong>COPY</strong> the key immediately (you won't see it again!)</li>
                <li>Add payment method and credits ($5-10 minimum)</li>
              </ol>

              <div className="bg-green-50 border border-green-200 rounded p-3 mt-3">
                <p className="text-xs font-medium text-green-900">✅ You'll get:</p>
                <p className="text-xs text-green-800 mt-1">OPENAI_API_KEY (starts with sk-proj-...)</p>
              </div>
            </div>
          </section>

          {/* Firebase Section */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-3">3️⃣ Firebase</h2>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <ol className="list-decimal list-inside space-y-1.5 text-gray-700 text-sm">
                <li>Go to <a href="https://console.firebase.google.com" target="_blank" className="text-blue-600 hover:underline">Firebase Console</a></li>
                <li>Click "Add project" → Name it "daystory"</li>
                <li>Disable Google Analytics</li>
                <li>Create <strong>Firestore Database</strong> (test mode)</li>
                <li>Create <strong>Storage</strong> (test mode)</li>
                <li>Go to Project Settings → Service Accounts</li>
                <li>Click "Generate new private key" (downloads JSON)</li>
              </ol>

              <div className="bg-green-50 border border-green-200 rounded p-3 mt-3">
                <p className="text-xs font-medium text-green-900">✅ You'll get from the JSON file:</p>
                <p className="text-xs text-green-800 mt-1">FIREBASE_PROJECT_ID</p>
                <p className="text-xs text-green-800">FIREBASE_PRIVATE_KEY</p>
                <p className="text-xs text-green-800">FIREBASE_CLIENT_EMAIL</p>
                <p className="text-xs text-green-800">FIREBASE_STORAGE_BUCKET</p>
              </div>
            </div>
          </section>

          {/* NextAuth Secret */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-3">4️⃣ NextAuth Secret</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-700 mb-3">Run this command in your terminal:</p>
              <pre className="bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto text-xs">
                <code>openssl rand -base64 32</code>
              </pre>

              <div className="bg-green-50 border border-green-200 rounded p-3 mt-3">
                <p className="text-xs font-medium text-green-900">✅ You'll get:</p>
                <p className="text-xs text-green-800 mt-1">NEXTAUTH_SECRET (32+ random characters)</p>
              </div>
            </div>
          </section>

          {/* Final Setup */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-3">5️⃣ Create .env.local File</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-700 mb-3">Create a file called <code className="bg-gray-200 px-2 py-1 rounded text-xs">.env.local</code> in your project root and add:</p>
              <pre className="bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto text-xs">
{`GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_generated_secret_here

OPENAI_API_KEY=your_openai_key_here

FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"
FIREBASE_CLIENT_EMAIL=your_client_email

NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket_url`}
              </pre>
            </div>
          </section>

          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
            <h3 className="text-base font-semibold text-yellow-900 mt-0">⚠️ Security Notes</h3>
            <ul className="text-yellow-800 space-y-1.5 text-sm">
              <li>NEVER commit .env.local to git</li>
              <li>NEVER share your API keys publicly</li>
              <li>Keep your Firebase JSON file secure</li>
            </ul>
          </div>

          <div className="mt-6 text-center">
            <a
              href="/demo"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Try the Demo First →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

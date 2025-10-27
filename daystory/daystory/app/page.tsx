import { auth } from "@/auth";
import Image from "next/image";
import OpenAIApiKeyButton from "@/components/OpenAIApiKeyButton";

export default async function Home() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
          <a href="/" className="flex items-center gap-2">
            <Image src="/DayStory Logo.png" alt="DayStory logo" width={40} height={40} className="h-10 w-auto" priority />
            <span className="text-base font-semibold text-black">DayStory</span>
          </a>
          <div className="flex items-center gap-3">
            <OpenAIApiKeyButton />
            {session ? (
              <>
                <span className="text-sm text-gray-600">{session.user.name}</span>
                <a
                  href="/dashboard"
                  className="px-5 py-2 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-all"
                >
                  Dashboard
                </a>
              </>
            ) : (
              <a
                href="/auth/signin"
                className="px-5 py-2 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-all"
              >
                Sign in
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center max-w-4xl mx-auto mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4 leading-tight">
            Your day, told like a<br />
            <span className="bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">Pixar movie</span>
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Transform your Google Calendar events into personalized, cinematic video vlogs with AI-powered storytelling
          </p>

          {/* CTA Buttons */}
          <div className="flex gap-3 justify-center flex-wrap">
            {session ? (
              <a
                href="/dashboard"
                className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-semibold hover:shadow-lg hover:scale-105 transition-all text-base"
              >
                Go to Dashboard
              </a>
            ) : (
              <a
                href="/auth/signin"
                className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-semibold hover:shadow-lg hover:scale-105 transition-all text-base"
              >
                Get Started
              </a>
            )}
            <a
              href="/demo"
              className="px-6 py-3 bg-white text-gray-900 border border-gray-200 rounded-full font-semibold hover:border-gray-300 hover:shadow-md transition-all text-base"
            >
              Try Demo
            </a>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="mt-16 max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">How It Works</h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center text-2xl mb-5">
                📅
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Calendar</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                Link your Google Calendar and select any day you want to transform into a story
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-2xl mb-5">
                🎭
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Choose Character</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                Pick from 5 Pixar-inspired characters to narrate your day with their unique personality
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-2xl mb-5">
                🎬
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Generate Video</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                AI creates a cinematic video vlog that brings your calendar events to life
              </p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-16 max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Features You'll Love</h2>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="flex items-start gap-3 p-5 bg-gray-50 rounded-2xl">
              <span className="text-xl">✨</span>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1 text-sm">AI-Powered Storytelling</h4>
                <p className="text-gray-600 text-xs">GPT-4o crafts personalized narratives from your calendar events</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-5 bg-gray-50 rounded-2xl">
              <span className="text-xl">🎨</span>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1 text-sm">Pixar-Style Characters</h4>
                <p className="text-gray-600 text-xs">Five unique character archetypes inspired by beloved Pixar films</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-5 bg-gray-50 rounded-2xl">
              <span className="text-xl">🎥</span>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1 text-sm">Cinematic Videos</h4>
                <p className="text-gray-600 text-xs">OpenAI Sora generates beautiful, movie-quality video vlogs</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-5 bg-gray-50 rounded-2xl">
              <span className="text-xl">💾</span>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1 text-sm">Download & Share</h4>
                <p className="text-gray-600 text-xs">Save your stories and share them with friends and family</p>
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-16 text-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Ready to turn your day into a movie?
          </h2>
          <p className="text-gray-600 mb-6 text-base">
            Get started in seconds with your Google Calendar
          </p>
          {!session && (
            <a
              href="/auth/signin"
              className="inline-block px-7 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-semibold hover:shadow-xl hover:scale-105 transition-all text-base"
            >
              Sign in with Google
            </a>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center text-xs text-gray-500">
          <p>Built with Next.js, TypeScript, and Tailwind CSS</p>
          <p className="mt-2">Powered by OpenAI GPT-4o & Sora</p>
        </div>
      </footer>
    </div>
  );
}

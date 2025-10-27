import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import StoriesGallery from "@/components/StoriesGallery";
import OpenAIApiKeyButton from "@/components/OpenAIApiKeyButton";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
          <a href="/" className="flex items-center gap-2">
            <Image
              src="/DayStory Logo.png"
              alt="DayStory logo"
              width={40}
              height={40}
              className="h-10 w-auto"
              priority
            />
            <span className="text-base font-semibold text-black">DayStory</span>
          </a>
          <div className="flex items-center gap-3">
            <OpenAIApiKeyButton />
            <span className="text-sm text-gray-600">{session.user?.name}</span>
            <form
              action={async () => {
                "use server";
                const { signOut } = await import("@/auth");
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="px-3.5 py-1.5 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {session.user?.name?.split(' ')[0]}
          </h1>
          <p className="text-sm text-gray-600">Transform your calendar into cinematic stories</p>
        </div>

        {/* Create New Story Card */}
        <div className="mb-10 bg-gradient-to-br from-rose-50 to-pink-50 rounded-3xl p-6 border border-rose-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Create Your DayStory</h2>
              <p className="text-sm text-gray-700 mb-3">
                Turn any day from your calendar into a Pixar-style video vlog in just a few clicks
              </p>

              <div className="flex flex-wrap gap-3 text-xs text-gray-600 mb-5">
                <div className="flex items-center gap-2">
                  <span className="text-rose-500">✓</span>
                  <span>Select your day</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-rose-500">✓</span>
                  <span>Choose character</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-rose-500">✓</span>
                  <span>Generate video</span>
                </div>
              </div>

              <a
                href="/create"
                className="inline-block px-6 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full text-sm font-semibold hover:shadow-lg hover:scale-105 transition-all"
              >
                Create New Story
              </a>
            </div>

            <div className="text-6xl">🎬</div>
          </div>
        </div>

        {/* Stories Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Your Stories</h2>
          </div>

          <StoriesGallery />
        </div>
      </div>
    </div>
  );
}

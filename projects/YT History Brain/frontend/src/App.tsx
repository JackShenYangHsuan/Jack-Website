import { useEffect, useState, useCallback, useMemo } from "react";
import type { Video, ProcessingStatus, CategoryStat, ChannelStat, SummarySearchResponse } from "@/lib/api";
import { getVideos, getProcessingStatus, startProcessing, filterByCategories, extractCategories, getCategoryStats, getChannelStats, searchSummaries, precomputeConnections, getConnectionStatus, deleteVideo, importVideos } from "@/lib/api";
import { VideoTable } from "@/components/VideoTable";
import { ProcessingProgress } from "@/components/ProcessingProgress";
import { CategoryFilter } from "@/components/CategoryFilter";
import { CategoryStats } from "@/components/CategoryStats";
import { ChannelStats } from "@/components/ChannelStats";
import { SearchBar } from "@/components/SearchBar";
import { SearchResults } from "@/components/SearchResults";
import { RelatedVideosPanel } from "@/components/RelatedVideosPanel";
import { ConnectionsView } from "@/components/ConnectionsView";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link2, LayoutGrid, Network, BarChart3, Lightbulb, Upload } from "lucide-react";
import { ImportVideosModal } from "@/components/ImportVideosModal";
import { InsightsView } from "@/components/InsightsView";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AlertDialog } from "@/components/ui/alert-dialog";

const STORAGE_KEY = "yt-history-brain-selected-categories";

// Helper to check if a video has a proper transcript-based summary
function hasProperSummary(summary: string): boolean {
  if (!summary) return false;
  if (summary === "No summary available.") return false;
  if (summary.includes("Based on the title")) return false;
  if (summary.startsWith("This video likely")) return false;
  if (summary.includes("Transcript not available")) return false;
  if (summary.includes("Could not generate summary")) return false;
  if (summary.includes("Failed to generate summary")) return false;
  return true;
}

function App() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [status, setStatus] = useState<ProcessingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [channelStats, setChannelStats] = useState<ChannelStat[]>([]);
  const [totalChannels, setTotalChannels] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);
  const [channelStatsLoading, setChannelStatsLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<SummarySearchResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [connectionsReady, setConnectionsReady] = useState(false);
  const [isComputingConnections, setIsComputingConnections] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [showApiBlockModal, setShowApiBlockModal] = useState(false);
  const [apiBlockMessage, setApiBlockMessage] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "complete" | "pending">("all");

  // Extract available categories from videos
  const availableCategories = useMemo(() => extractCategories(videos), [videos]);

  // Filter videos by selected categories (AND logic) and status
  const filteredVideos = useMemo(() => {
    let result = filterByCategories(videos, selectedCategories);

    if (statusFilter !== "all") {
      result = result.filter((video) => {
        const isComplete = hasProperSummary(video.summary);
        return statusFilter === "complete" ? isComplete : !isComplete;
      });
    }

    return result;
  }, [videos, selectedCategories, statusFilter]);

  // Persist selected categories to localStorage
  const handleCategoryChange = (categories: string[]) => {
    setSelectedCategories(categories);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
  };

  // Search handler
  const handleSearch = async (query: string) => {
    try {
      setIsSearching(true);
      setError(null);
      const results = await searchSummaries(query);
      setSearchResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setSearchResults(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchResults(null);
  };

  // Video selection handler for related videos
  const handleVideoSelect = (video: Video) => {
    setSelectedVideo(video);
  };

  const handleCloseRelatedVideos = () => {
    setSelectedVideo(null);
  };

  const handleSelectRelatedVideo = (videoId: string) => {
    // Find the video in our list and select it
    const video = videos.find((v) => v.video_id === videoId);
    if (video) {
      setSelectedVideo(video);
    }
  };

  // Delete video handler
  const handleDeleteVideo = async (videoId: string) => {
    try {
      await deleteVideo(videoId);
      // Remove from local state
      setVideos((prev) => prev.filter((v) => v.video_id !== videoId));
      // Refresh stats
      fetchCategoryStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete video");
    }
  };

  // Video processed handler - update local state with new video data
  const handleVideoProcessed = (updatedVideo: Video) => {
    setVideos((prev) =>
      prev.map((v) => (v.video_id === updatedVideo.video_id ? updatedVideo : v))
    );
    // Refresh stats
    fetchCategoryStats();
    fetchChannelStats();
  };

  // Import videos handler
  const handleImportVideos = async (videos: { url: string; date: string }[]) => {
    await importVideos(videos);
    await fetchVideos();
    await fetchCategoryStats();
    await fetchChannelStats();
  };

  // Compute connections handler
  const handleComputeConnections = async () => {
    try {
      setIsComputingConnections(true);
      setError(null);
      await precomputeConnections(0.5, 10);
      setConnectionsReady(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to compute connections");
    } finally {
      setIsComputingConnections(false);
    }
  };

  // Check connections status
  const checkConnectionsStatus = useCallback(async () => {
    try {
      const status = await getConnectionStatus();
      setConnectionsReady(status.has_precomputed);
    } catch {
      // Ignore - connections might not be computed yet
    }
  }, []);

  const fetchVideos = useCallback(async () => {
    try {
      const data = await getVideos();
      setVideos(data.videos);
    } catch {
      console.error("Failed to fetch videos");
    }
  }, []);

  const fetchCategoryStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const data = await getCategoryStats();
      setCategoryStats(data.stats);
    } catch {
      console.error("Failed to fetch category stats");
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchChannelStats = useCallback(async () => {
    try {
      setChannelStatsLoading(true);
      const data = await getChannelStats();
      setChannelStats(data.stats);
      setTotalChannels(data.total_channels);
    } catch {
      console.error("Failed to fetch channel stats");
    } finally {
      setChannelStatsLoading(false);
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await getProcessingStatus();
      setStatus(data);
      return data;
    } catch {
      console.error("Failed to fetch status");
      return null;
    }
  }, []);

  const handleStartProcessing = async () => {
    try {
      setError(null);
      await startProcessing();
      // Start polling for status
      pollStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start processing");
    }
  };

  const pollStatus = useCallback(async () => {
    const poll = async () => {
      const currentStatus = await fetchStatus();
      if (currentStatus?.is_processing) {
        await fetchVideos(); // Update videos list during processing
        setTimeout(poll, 2000); // Poll every 2 seconds
      } else {
        // Check if processing stopped due to API block
        if (currentStatus?.stopped_due_to_api_block) {
          setApiBlockMessage(currentStatus.api_block_message || "YouTube is blocking transcript requests. Processing has been paused. Try again later.");
          setShowApiBlockModal(true);
        }
        await fetchVideos(); // Final fetch when done
        await fetchCategoryStats(); // Refresh category stats
        await fetchChannelStats(); // Refresh channel stats
        setIsLoading(false);
      }
    };
    poll();
  }, [fetchStatus, fetchVideos, fetchCategoryStats, fetchChannelStats]);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([fetchVideos(), fetchCategoryStats(), fetchChannelStats(), checkConnectionsStatus()]);
      const currentStatus = await fetchStatus();
      if (currentStatus?.is_processing) {
        pollStatus();
      } else {
        setIsLoading(false);
      }
    };
    init();
  }, [fetchVideos, fetchStatus, pollStatus, fetchCategoryStats, fetchChannelStats, checkConnectionsStatus]);

  return (
    <div className="min-h-screen bg-background">
      <div className="w-[90%] mx-auto py-4 px-4">
        <header className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1">
                YT History Brain
              </h1>
              <p className="text-sm text-muted-foreground">
                AI-powered summaries and categorization of your YouTube watch history
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                onClick={() => setShowImportModal(true)}
                variant="outline"
                size="sm"
              >
                <Upload className="w-3.5 h-3.5 mr-1.5" />
                Import
              </Button>
              <Button
                onClick={handleComputeConnections}
                disabled={isComputingConnections || status?.is_processing}
                variant={connectionsReady ? "outline" : "default"}
                size="sm"
              >
                <Link2 className="w-3.5 h-3.5 mr-1.5" />
                {isComputingConnections ? "Computing..." : connectionsReady ? "Recompute" : "Compute Connections"}
              </Button>
              <Button
                onClick={handleStartProcessing}
                disabled={status?.is_processing}
                size="sm"
              >
                {status?.is_processing ? "Processing..." : "Process Videos"}
              </Button>
            </div>
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview" className="flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center gap-1.5">
              <LayoutGrid className="w-4 h-4" />
              Videos
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4" />
              Insights
            </TabsTrigger>
            <TabsTrigger value="connections" className="flex items-center gap-1.5">
              <Network className="w-4 h-4" />
              Connections
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{videos.length}</div>
                  <p className="text-xs text-muted-foreground">Total Videos</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-primary">{filteredVideos.length}</div>
                  <p className="text-xs text-muted-foreground">Filtered Videos</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-500">
                    {videos.filter((v) => hasProperSummary(v.summary)).length}
                  </div>
                  <p className="text-xs text-muted-foreground">Fully Processed</p>
                </CardContent>
              </Card>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Category Stats Dashboard */}
              <CategoryStats
                stats={categoryStats}
                totalVideos={videos.length}
                isLoading={statsLoading}
              />

              {/* Channel Stats Dashboard */}
              <ChannelStats
                stats={channelStats}
                totalVideos={videos.length}
                totalChannels={totalChannels}
                isLoading={channelStatsLoading}
              />
            </div>
          </TabsContent>

          <TabsContent value="videos" className="space-y-4">
            {/* Search Bar */}
            <SearchBar
              onSearch={handleSearch}
              isLoading={isSearching}
              onClear={handleClearSearch}
              hasResults={searchResults !== null}
            />

            {/* Search Results */}
            {searchResults && (
              <SearchResults
                synthesis={searchResults.synthesis}
                results={searchResults.results}
                onClose={handleClearSearch}
              />
            )}

            {/* Filters */}
            <div className="flex items-center justify-between gap-4">
              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                <div className="flex gap-1 p-1 bg-muted rounded-lg">
                  {(["all", "complete", "pending"] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors capitalize ${
                        statusFilter === status
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Filter */}
              <CategoryFilter
                categories={availableCategories}
                selectedCategories={selectedCategories}
                onChange={handleCategoryChange}
              />
            </div>

            {/* Error Message */}
            {error && (
              <Card className="border-destructive/50 bg-destructive/10">
                <CardContent className="pt-4">
                  <p className="text-sm text-destructive">{error}</p>
                </CardContent>
              </Card>
            )}

            {/* Processing Progress */}
            {status?.is_processing && <ProcessingProgress status={status} />}

            {/* Video Table */}
            <VideoTable
              videos={filteredVideos}
              isLoading={isLoading}
              onVideoSelect={connectionsReady ? handleVideoSelect : undefined}
              onDeleteVideo={handleDeleteVideo}
              onVideoProcessed={handleVideoProcessed}
            />
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <InsightsView videoCount={videos.length} />
          </TabsContent>

          <TabsContent value="connections">
            <ConnectionsView
              categories={availableCategories}
              selectedCategories={selectedCategories}
              onCategoryChange={handleCategoryChange}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Related Videos Panel */}
      {selectedVideo && (
        <RelatedVideosPanel
          video={selectedVideo}
          onClose={handleCloseRelatedVideos}
          onSelectVideo={handleSelectRelatedVideo}
        />
      )}

      {/* API Block Warning Modal */}
      <AlertDialog
        open={showApiBlockModal}
        onClose={() => setShowApiBlockModal(false)}
        title="Processing Paused"
        message={apiBlockMessage}
      />

      {/* Import Videos Modal */}
      <ImportVideosModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportVideos}
      />
    </div>
  );
}

export default App;

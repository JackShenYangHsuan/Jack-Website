import { useState, useEffect, useMemo } from "react";
import type { GlobalInsights, InsightItem, Video, SavedInsights } from "@/lib/api";
import { getInsights, generateInsights, getVideos, deleteInsight, saveInsight, getSavedInsights, deleteSavedInsight } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Sparkles, Loader2, RefreshCw, X, ExternalLink, Trash2, Bookmark, BookmarkCheck, Calendar } from "lucide-react";

interface InsightsViewProps {
  videoCount: number;
}

function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}

interface SourceVideosModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  text: string;
  videos: Video[];
}

function SourceVideosModal({ open, onClose, title, text, videos }: SourceVideosModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <Card className="relative z-10 w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden shadow-2xl">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {title === "Key Insight" ? (
                <Lightbulb className="w-5 h-5 text-yellow-500" />
              ) : (
                <Sparkles className="w-5 h-5 text-purple-500" />
              )}
              <CardTitle className="text-lg">{title}</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 overflow-y-auto max-h-[60vh]">
          {/* The insight/fact text */}
          <div className={`p-3 rounded-lg mb-4 ${
            title === "Key Insight"
              ? "bg-yellow-500/10 border border-yellow-500/30"
              : "bg-purple-500/10 border border-purple-500/30"
          }`}>
            <p className="text-sm text-foreground">{text}</p>
          </div>

          {/* Source videos */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Source Videos ({videos.length})
            </h4>
            {videos.length === 0 ? (
              <p className="text-sm text-muted-foreground">No source videos available.</p>
            ) : (
              <div className="space-y-3">
                {videos.map((video) => (
                  <a
                    key={video.video_id}
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <img
                      src={getYouTubeThumbnail(video.video_id)}
                      alt={video.title}
                      className="w-24 h-auto rounded flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground line-clamp-2 flex items-start gap-1">
                        {video.title}
                        <ExternalLink className="w-3 h-3 flex-shrink-0 mt-0.5" />
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {video.categories.slice(0, 3).map((cat) => (
                          <Badge key={cat} variant="secondary" className="text-[10px] px-1.5 py-0">
                            {cat}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {video.summary.substring(0, 150)}...
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function InsightsView({ videoCount }: InsightsViewProps) {
  const [insights, setInsights] = useState<GlobalInsights | null>(null);
  const [savedInsights, setSavedInsights] = useState<SavedInsights>({ insights: [], fun_facts: [] });
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"generated" | "saved">("generated");

  // Date filter state
  const [filterValue, setFilterValue] = useState<number>(7);
  const [filterUnit, setFilterUnit] = useState<"days" | "weeks" | "all">("all");

  // Calculate date range from filter
  const { startDate, endDate } = useMemo(() => {
    if (filterUnit === "all") {
      return { startDate: undefined, endDate: undefined };
    }
    const end = new Date();
    const start = new Date();
    const daysToSubtract = filterUnit === "weeks" ? filterValue * 7 : filterValue;
    start.setDate(start.getDate() - daysToSubtract);
    return {
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    };
  }, [filterValue, filterUnit]);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalText, setModalText] = useState("");
  const [modalVideos, setModalVideos] = useState<Video[]>([]);

  // Parse date string to YYYY-MM-DD format
  const parseVideoDate = (dateStr: string): string | null => {
    if (!dateStr) return null;

    // Already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      return dateStr.split("T")[0];
    }

    // MM/DD/YYYY format
    if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(dateStr)) {
      const parts = dateStr.split("/");
      const month = parts[0].padStart(2, "0");
      const day = parts[1].padStart(2, "0");
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }

    return null;
  };

  // Count videos in date range
  const videosInRange = useMemo(() => {
    if (filterUnit === "all" || (!startDate && !endDate)) return allVideos.length;

    return allVideos.filter((video) => {
      if (!video.watched_at) return false;

      const videoDate = parseVideoDate(video.watched_at);
      if (!videoDate) return false;
      if (startDate && videoDate < startDate) return false;
      if (endDate && videoDate > endDate) return false;
      return true;
    }).length;
  }, [allVideos, startDate, endDate, filterUnit]);

  // Load existing insights and videos on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [insightsData, videosData, savedData] = await Promise.all([
          getInsights(),
          getVideos(),
          getSavedInsights()
        ]);
        setInsights(insightsData);
        setAllVideos(videosData.videos);
        setSavedInsights(savedData);
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleGenerateInsights = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      const data = await generateInsights(
        10,
        10,
        filterUnit === "all" ? undefined : startDate,
        filterUnit === "all" ? undefined : endDate
      );
      setInsights(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate insights");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInsightClick = (item: InsightItem, type: "insight" | "fun_fact") => {
    // Find videos by source_ids
    const sourceVideos = allVideos.filter(v => item.source_ids.includes(v.video_id));
    setModalTitle(type === "insight" ? "Key Insight" : "Fun Fact");
    setModalText(item.text);
    setModalVideos(sourceVideos);
    setModalOpen(true);
  };

  const handleDelete = async (type: "insight" | "fun_fact", index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteInsight(type, index);
      // Update local state
      if (insights) {
        const key = type === "insight" ? "insights" : "fun_facts";
        const updated = { ...insights };
        updated[key] = updated[key].filter((_, i) => i !== index);
        setInsights(updated);
      }
    } catch (err) {
      console.error("Failed to delete:", err);
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const handleSave = async (item: InsightItem, type: "insight" | "fun_fact", e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await saveInsight(type, item.text, item.source_ids);
      // Refresh saved insights
      const saved = await getSavedInsights();
      setSavedInsights(saved);
    } catch (err) {
      console.error("Failed to save:", err);
    }
  };

  const handleUnsave = async (type: "insight" | "fun_fact", index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteSavedInsight(type, index);
      // Update local state
      const key = type === "insight" ? "insights" : "fun_facts";
      const updated = { ...savedInsights };
      updated[key] = updated[key].filter((_, i) => i !== index);
      setSavedInsights(updated);
    } catch (err) {
      console.error("Failed to unsave:", err);
    }
  };

  // Helper to get text from insight item (handles both old and new format)
  const getItemText = (item: InsightItem | string): string => {
    if (typeof item === "string") return item;
    return item.text;
  };

  // Helper to safely get source_ids
  const getSourceIds = (item: InsightItem | string): string[] => {
    if (typeof item === "string") return [];
    return item.source_ids || [];
  };

  const isInsightSaved = (text: string, type: "insight" | "fun_fact"): boolean => {
    const key = type === "insight" ? "insights" : "fun_facts";
    return savedInsights[key].some(item => {
      if (typeof item === "string") return item === text;
      return item.text === text;
    });
  };

  // Filter out saved items from generated list
  const unsavedInsights = insights?.insights.filter(item => !isInsightSaved(getItemText(item), "insight")) || [];
  const unsavedFunFacts = insights?.fun_facts.filter(item => !isInsightSaved(getItemText(item), "fun_fact")) || [];

  const hasInsights = insights && (unsavedInsights.length > 0 || unsavedFunFacts.length > 0);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-4 w-24 bg-muted animate-pulse rounded mb-2" />
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Tabs and Generate Button */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Global Insights</h2>
              <p className="text-sm text-muted-foreground">
                AI-generated insights from your {videoCount} videos
              </p>
            </div>
            {/* Tab buttons */}
            <div className="flex gap-1 p-1 bg-muted rounded-lg">
              <button
                onClick={() => setActiveTab("generated")}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeTab === "generated"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Generated
              </button>
              <button
                onClick={() => setActiveTab("saved")}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                  activeTab === "saved"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <BookmarkCheck className="w-3.5 h-3.5" />
                Saved
                {(savedInsights.insights.length + savedInsights.fun_facts.length) > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                    {savedInsights.insights.length + savedInsights.fun_facts.length}
                  </span>
                )}
              </button>
            </div>
          </div>
          {activeTab === "generated" && (
            <Button
              onClick={handleGenerateInsights}
              disabled={isGenerating || videosInRange === 0}
              className="gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : hasInsights ? (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Regenerate
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Insights
                </>
              )}
            </Button>
          )}
        </div>

        {/* Date Filter */}
        {activeTab === "generated" && (
          <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={filterUnit}
                onChange={(e) => setFilterUnit(e.target.value as "days" | "weeks" | "all")}
                className="px-2 py-1 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All time</option>
                <option value="days">Last X days</option>
                <option value="weeks">Last X weeks</option>
              </select>
              {filterUnit !== "all" && (
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={filterValue}
                  onChange={(e) => setFilterValue(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 px-2 py-1 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-center"
                />
              )}
            </div>
            <span className="text-sm text-muted-foreground ml-auto">
              {videosInRange} video{videosInRange !== 1 ? "s" : ""} in range
            </span>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="pt-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Generated Tab Content */}
      {activeTab === "generated" && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  <div>
                    <div className="text-2xl font-bold">{unsavedInsights.length}</div>
                    <p className="text-xs text-muted-foreground">Key Insights</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  <div>
                    <div className="text-2xl font-bold">{unsavedFunFacts.length}</div>
                    <p className="text-xs text-muted-foreground">Fun Facts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-primary">{insights?.video_count || videoCount}</div>
                <p className="text-xs text-muted-foreground">Videos Analyzed</p>
              </CardContent>
            </Card>
          </div>

          {/* Empty State */}
          {!hasInsights && !isGenerating && (
            <Card>
              <CardContent className="py-12 text-center">
                <Lightbulb className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No Insights Generated Yet
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
                  Click "Generate Insights" to analyze all your processed videos and extract
                  key learnings and interesting facts.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Insights Display */}
          {hasInsights && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Key Insights */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Lightbulb className="w-5 h-5 text-yellow-500" />
                    Key Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {unsavedInsights.map((item, idx) => {
                    // Find original index for delete operation
                    const originalIdx = insights?.insights.findIndex(i => getItemText(i) === getItemText(item)) ?? idx;
                    return (
                      <div
                        key={idx}
                        className="group relative flex gap-3 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20 hover:bg-yellow-500/10 hover:border-yellow-500/40 transition-colors"
                      >
                        <button
                          onClick={() => handleInsightClick(item, "insight")}
                          className="flex-1 text-left flex gap-3"
                        >
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center text-xs font-semibold">
                            {idx + 1}
                          </span>
                          <div className="flex-1">
                            <p className="text-sm text-foreground/90 leading-relaxed">{getItemText(item)}</p>
                            {getSourceIds(item).length > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                From {getSourceIds(item).length} video{getSourceIds(item).length > 1 ? 's' : ''} - Click to view
                              </p>
                            )}
                          </div>
                        </button>
                        {/* Action buttons */}
                        <div className="flex-shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => handleSave(item, "insight", e)}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                            title="Save"
                          >
                            <Bookmark className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleDelete("insight", originalIdx, e)}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Fun Facts */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    Fun Facts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {unsavedFunFacts.map((item, idx) => {
                    // Find original index for delete operation
                    const originalIdx = insights?.fun_facts.findIndex(i => getItemText(i) === getItemText(item)) ?? idx;
                    return (
                      <div
                        key={idx}
                        className="group relative flex gap-3 p-3 rounded-lg bg-purple-500/5 border border-purple-500/20 hover:bg-purple-500/10 hover:border-purple-500/40 transition-colors"
                      >
                        <button
                          onClick={() => handleInsightClick(item, "fun_fact")}
                          className="flex-1 text-left flex gap-3"
                        >
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 text-purple-500 flex items-center justify-center text-xs font-semibold">
                            {idx + 1}
                          </span>
                          <div className="flex-1">
                            <p className="text-sm text-foreground/90 leading-relaxed">{getItemText(item)}</p>
                            {getSourceIds(item).length > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                From {getSourceIds(item).length} video{getSourceIds(item).length > 1 ? 's' : ''} - Click to view
                              </p>
                            )}
                          </div>
                        </button>
                        {/* Action buttons */}
                        <div className="flex-shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => handleSave(item, "fun_fact", e)}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                            title="Save"
                          >
                            <Bookmark className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleDelete("fun_fact", originalIdx, e)}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Generated timestamp */}
          {insights?.generated_at && (
            <p className="text-xs text-muted-foreground text-center">
              Last generated: {new Date(insights.generated_at).toLocaleString()}
            </p>
          )}
        </>
      )}

      {/* Saved Tab Content */}
      {activeTab === "saved" && (
        <>
          {(savedInsights.insights.length === 0 && savedInsights.fun_facts.length === 0) ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookmarkCheck className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No Saved Insights Yet
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Save your favorite insights and fun facts by clicking the bookmark icon.
                  They'll appear here for easy reference.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Saved Insights */}
              {savedInsights.insights.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Lightbulb className="w-5 h-5 text-yellow-500" />
                      Saved Insights ({savedInsights.insights.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {savedInsights.insights.map((item, idx) => (
                      <div
                        key={idx}
                        className="group relative flex gap-3 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20 hover:bg-yellow-500/10 hover:border-yellow-500/40 transition-colors"
                      >
                        <button
                          onClick={() => handleInsightClick(item, "insight")}
                          className="flex-1 text-left flex gap-3"
                        >
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center text-xs font-semibold">
                            {idx + 1}
                          </span>
                          <div className="flex-1">
                            <p className="text-sm text-foreground/90 leading-relaxed">{getItemText(item)}</p>
                            {getSourceIds(item).length > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                From {getSourceIds(item).length} video{getSourceIds(item).length > 1 ? 's' : ''} - Click to view
                              </p>
                            )}
                          </div>
                        </button>
                        <button
                          onClick={(e) => handleUnsave("insight", idx, e)}
                          className="flex-shrink-0 p-1.5 rounded-md text-primary bg-primary/10 hover:bg-destructive/10 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                          title="Remove from saved"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Saved Fun Facts */}
              {savedInsights.fun_facts.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Sparkles className="w-5 h-5 text-purple-500" />
                      Saved Fun Facts ({savedInsights.fun_facts.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {savedInsights.fun_facts.map((item, idx) => (
                      <div
                        key={idx}
                        className="group relative flex gap-3 p-3 rounded-lg bg-purple-500/5 border border-purple-500/20 hover:bg-purple-500/10 hover:border-purple-500/40 transition-colors"
                      >
                        <button
                          onClick={() => handleInsightClick(item, "fun_fact")}
                          className="flex-1 text-left flex gap-3"
                        >
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 text-purple-500 flex items-center justify-center text-xs font-semibold">
                            {idx + 1}
                          </span>
                          <div className="flex-1">
                            <p className="text-sm text-foreground/90 leading-relaxed">{getItemText(item)}</p>
                            {getSourceIds(item).length > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                From {getSourceIds(item).length} video{getSourceIds(item).length > 1 ? 's' : ''} - Click to view
                              </p>
                            )}
                          </div>
                        </button>
                        <button
                          onClick={(e) => handleUnsave("fun_fact", idx, e)}
                          className="flex-shrink-0 p-1.5 rounded-md text-primary bg-primary/10 hover:bg-destructive/10 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                          title="Remove from saved"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </>
      )}

      {/* Source Videos Modal */}
      <SourceVideosModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        text={modalText}
        videos={modalVideos}
      />
    </div>
  );
}

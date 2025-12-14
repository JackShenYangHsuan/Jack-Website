const API_BASE = "http://localhost:8000/api";

export interface Video {
  video_id: string;
  title: string;
  url: string;
  summary: string;
  categories: string[];
  transcript_available: boolean;
  takeaways: string[];  // Key insights from the video
  fun_facts: string[];  // Interesting facts mentioned
  watched_at?: string;  // Date when the video was watched
}

export interface ProcessingStatus {
  is_processing: boolean;
  processed: number;
  total: number;
  current_video: string | null;
  current_title: string | null;
  stopped_due_to_api_block: boolean;
  api_block_message: string | null;
}

export interface VideosResponse {
  videos: Video[];
  total: number;
}

export async function getVideos(): Promise<VideosResponse> {
  const response = await fetch(`${API_BASE}/videos`);
  if (!response.ok) {
    throw new Error("Failed to fetch videos");
  }
  return response.json();
}

export async function getProcessingStatus(): Promise<ProcessingStatus> {
  const response = await fetch(`${API_BASE}/process-status`);
  if (!response.ok) {
    throw new Error("Failed to fetch processing status");
  }
  return response.json();
}

export async function startProcessing(): Promise<{ message: string; total_videos: number }> {
  const response = await fetch(`${API_BASE}/process-videos`, {
    method: "POST",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to start processing");
  }
  return response.json();
}

export async function deleteVideo(videoId: string): Promise<{ message: string; video_id: string }> {
  const response = await fetch(`${API_BASE}/videos/${videoId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to delete video");
  }
  return response.json();
}

export async function processSingleVideo(videoId: string): Promise<{ success: boolean; video: Video }> {
  const response = await fetch(`${API_BASE}/videos/${videoId}/process`, {
    method: "POST",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to process video");
  }
  return response.json();
}

// Filter videos by categories (AND logic - must match ALL selected)
export function filterByCategories(videos: Video[], selectedCategories: string[]): Video[] {
  if (selectedCategories.length === 0) return videos;
  return videos.filter((video) =>
    selectedCategories.every((cat) => video.categories.includes(cat))
  );
}

// Extract unique categories from videos
export function extractCategories(videos: Video[]): string[] {
  const categorySet = new Set<string>();
  videos.forEach((video) => {
    video.categories.forEach((cat) => categorySet.add(cat));
  });
  return Array.from(categorySet);
}

// Category Stats
export interface CategoryStat {
  category: string;
  count: number;
  percentage: number;
}

export interface CategoryStatsResponse {
  stats: CategoryStat[];
  total_videos: number;
}

export async function getCategoryStats(): Promise<CategoryStatsResponse> {
  const response = await fetch(`${API_BASE}/category-stats`);
  if (!response.ok) {
    throw new Error("Failed to fetch category stats");
  }
  return response.json();
}

// Channel Stats
export interface ChannelStat {
  channel: string;
  count: number;
  percentage: number;
}

export interface ChannelStatsResponse {
  stats: ChannelStat[];
  total_videos: number;
  total_channels: number;
}

export async function getChannelStats(): Promise<ChannelStatsResponse> {
  const response = await fetch(`${API_BASE}/channel-stats`);
  if (!response.ok) {
    throw new Error("Failed to fetch channel stats");
  }
  return response.json();
}

// Summary Search
export interface SearchResult {
  video_id: string;
  title: string;
  url: string;
  summary: string;
  categories: string[];
  distance: number;
}

export interface SummarySearchResponse {
  synthesis: string;
  results: SearchResult[];
}

export async function searchSummaries(query: string, nResults = 10): Promise<SummarySearchResponse> {
  const response = await fetch(`${API_BASE}/search-summaries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, n_results: nResults }),
  });
  if (!response.ok) {
    throw new Error("Search failed");
  }
  return response.json();
}

export async function reindexSummaries(): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE}/reindex-summaries`, { method: "POST" });
  if (!response.ok) {
    throw new Error("Reindex failed");
  }
  return response.json();
}

// ============================================================================
// Connections API - Video Similarity & Knowledge Graph
// ============================================================================

export interface SimilarVideo {
  video_id: string;
  title: string;
  url: string;
  categories: string[];
  summary: string;
  similarity: number;
}

export interface SimilarVideosResponse {
  video_id: string;
  similar_videos: SimilarVideo[];
}

export interface GraphNode {
  id: string;
  title: string;
  categories: string[];
  url: string;
  summary: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  weight: number;
}

export interface GraphResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface ConnectionStats {
  computed_at: string | null;
  video_count: number;
  edge_count: number;
  similarity_threshold: number;
}

export async function getSimilarVideos(videoId: string, nResults = 5): Promise<SimilarVideosResponse> {
  const response = await fetch(
    `${API_BASE}/connections/videos/${videoId}/similar?n_results=${nResults}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch similar videos");
  }
  return response.json();
}

export async function getConnectionGraph(
  categories?: string[],
  minSimilarity = 0.5
): Promise<GraphResponse> {
  const params = new URLSearchParams();
  if (categories && categories.length > 0) {
    params.set("categories", categories.join(","));
  }
  params.set("min_similarity", minSimilarity.toString());

  const response = await fetch(`${API_BASE}/connections/graph?${params}`);
  if (!response.ok) {
    throw new Error("Failed to fetch connection graph");
  }
  return response.json();
}

export async function precomputeConnections(
  similarityThreshold = 0.5,
  topK = 10
): Promise<{ message: string; video_count: number; edge_count: number; computed_at: string }> {
  const response = await fetch(`${API_BASE}/connections/precompute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ similarity_threshold: similarityThreshold, top_k: topK }),
  });
  if (!response.ok) {
    throw new Error("Failed to precompute connections");
  }
  return response.json();
}

export async function getConnectionStats(): Promise<ConnectionStats> {
  const response = await fetch(`${API_BASE}/connections/stats`);
  if (!response.ok) {
    throw new Error("Failed to fetch connection stats");
  }
  return response.json();
}

export async function getConnectionStatus(): Promise<{ has_precomputed: boolean; stats: ConnectionStats }> {
  const response = await fetch(`${API_BASE}/connections/status`);
  if (!response.ok) {
    throw new Error("Failed to fetch connection status");
  }
  return response.json();
}

// ============================================================================
// Global Insights API
// ============================================================================

export interface InsightItem {
  text: string;
  source_ids: string[];
}

export interface GlobalInsights {
  insights: InsightItem[];
  fun_facts: InsightItem[];
  generated_at: string | null;
  video_count: number;
}

export async function getInsights(): Promise<GlobalInsights> {
  const response = await fetch(`${API_BASE}/insights`);
  if (!response.ok) {
    throw new Error("Failed to fetch insights");
  }
  return response.json();
}

export async function generateInsights(
  numInsights = 10,
  numFunFacts = 10,
  startDate?: string,
  endDate?: string
): Promise<GlobalInsights> {
  const response = await fetch(`${API_BASE}/generate-insights`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      num_insights: numInsights,
      num_fun_facts: numFunFacts,
      start_date: startDate,
      end_date: endDate,
    }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to generate insights");
  }
  return response.json();
}

export async function deleteInsight(
  type: "insight" | "fun_fact",
  index: number
): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE}/insights/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, index }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to delete insight");
  }
  return response.json();
}

export async function saveInsight(
  type: "insight" | "fun_fact",
  text: string,
  sourceIds: string[]
): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE}/insights/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, text, source_ids: sourceIds }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to save insight");
  }
  return response.json();
}

export interface SavedInsights {
  insights: InsightItem[];
  fun_facts: InsightItem[];
}

export async function getSavedInsights(): Promise<SavedInsights> {
  const response = await fetch(`${API_BASE}/insights/saved`);
  if (!response.ok) {
    throw new Error("Failed to fetch saved insights");
  }
  return response.json();
}

export async function deleteSavedInsight(
  type: "insight" | "fun_fact",
  index: number
): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE}/insights/saved/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, index }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to delete saved insight");
  }
  return response.json();
}

// ============================================================================
// Multi-Video Synthesis API
// ============================================================================

export interface VideoSynthesisResponse {
  synthesis: string;
  video_count: number;
  common_themes: string[];
}

export async function synthesizeVideos(videoIds: string[]): Promise<VideoSynthesisResponse> {
  const response = await fetch(`${API_BASE}/synthesize-videos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ video_ids: videoIds }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to synthesize videos");
  }
  return response.json();
}

// ============================================================================
// Connection Theme API
// ============================================================================

export interface ConnectionThemeResponse {
  source_id: string;
  target_id: string;
  common_topics: string[];
  agreements: string[];
  contradictions: string[];
  similarity_score: number;
}

export async function getConnectionTheme(
  sourceId: string,
  targetId: string
): Promise<ConnectionThemeResponse> {
  const response = await fetch(`${API_BASE}/connection-theme`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source_id: sourceId, target_id: targetId }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to get connection theme");
  }
  return response.json();
}

// ============================================================================
// Import Videos API
// ============================================================================

export interface ImportVideoItem {
  url: string;
  date: string;
}

export interface ImportVideosResponse {
  message: string;
  imported_count: number;
  skipped_count: number;
}

export async function importVideos(videos: ImportVideoItem[]): Promise<ImportVideosResponse> {
  const response = await fetch(`${API_BASE}/import-videos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ videos }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to import videos");
  }
  return response.json();
}

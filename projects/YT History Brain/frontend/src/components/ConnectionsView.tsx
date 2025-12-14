import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { GraphNode, GraphEdge, ConnectionStats, VideoSynthesisResponse, ConnectionThemeResponse } from "@/lib/api";
import {
  getConnectionGraph,
  getConnectionStats,
  precomputeConnections,
  getSimilarVideos,
  synthesizeVideos,
  getConnectionTheme,
} from "@/lib/api";
import { KnowledgeGraph, type KnowledgeGraphMethods, type SelectedEdge } from "./KnowledgeGraph";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { getCategoryTailwindClasses } from "@/lib/constants";
import {
  RefreshCw,
  ExternalLink,
  X,
  Network,
  Zap,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles,
  Link2,
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface ConnectionsViewProps {
  categories: string[];
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
}

interface SimilarVideoItem {
  video_id: string;
  title: string;
  url: string;
  categories: string[];
  summary: string;
  similarity: number;
}

// ============================================================================
// HELPERS
// ============================================================================

// Use centralized category colors
const getCategoryColor = getCategoryTailwindClasses;

function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ConnectionsView({
  categories,
  selectedCategories,
  onCategoryChange,
}: ConnectionsViewProps) {
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const graphMethodsRef = useRef<KnowledgeGraphMethods | null>(null);

  // Data state
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [stats, setStats] = useState<ConnectionStats | null>(null);

  // UI state
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<GraphNode[]>([]);
  const [selectedEdge, setSelectedEdge] = useState<SelectedEdge | null>(null);
  const [similarVideos, setSimilarVideos] = useState<SimilarVideoItem[]>([]);
  const [synthesis, setSynthesis] = useState<VideoSynthesisResponse | null>(null);
  const [connectionTheme, setConnectionTheme] = useState<ConnectionThemeResponse | null>(null);
  const [minSimilarity, setMinSimilarity] = useState(0.4);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isComputing, setIsComputing] = useState(false);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [loadingSynthesis, setLoadingSynthesis] = useState(false);
  const [loadingConnectionTheme, setLoadingConnectionTheme] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derived state
  const hasSingleSelection = selectedNode !== null && selectedNodes.length === 0 && !selectedEdge;
  const hasMultiSelection = selectedNodes.length > 1 && !selectedEdge;
  const hasEdgeSelection = selectedEdge !== null;
  const showPanel = hasSingleSelection || hasMultiSelection || hasEdgeSelection;

  // ResizeObserver for container dimensions
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateDimensions = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;

      if (width > 0 && height > 0) {
        setDimensions({ width, height });
      }
    };

    const initialTimer = setTimeout(updateDimensions, 50);

    const observer = new ResizeObserver(() => {
      requestAnimationFrame(updateDimensions);
    });

    observer.observe(container);

    return () => {
      clearTimeout(initialTimer);
      observer.disconnect();
    };
  }, [showPanel]);

  // Fetch graph data
  const fetchGraphData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [graphData, statsData] = await Promise.all([
        getConnectionGraph(
          selectedCategories.length > 0 ? selectedCategories : undefined,
          minSimilarity
        ),
        getConnectionStats(),
      ]);

      setNodes(graphData.nodes);
      setEdges(graphData.edges);
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load graph data");
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategories, minSimilarity]);

  useEffect(() => {
    fetchGraphData();
  }, [fetchGraphData]);

  // Compute connections
  const handleComputeConnections = useCallback(async () => {
    try {
      setIsComputing(true);
      setError(null);
      await precomputeConnections(0.5, 10);
      await fetchGraphData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to compute connections");
    } finally {
      setIsComputing(false);
    }
  }, [fetchGraphData]);

  // Single node click handler
  const handleNodeClick = useCallback(async (node: GraphNode) => {
    // Clear other selections
    setSelectedNodes([]);
    setSynthesis(null);
    setSelectedEdge(null);
    setConnectionTheme(null);
    setSelectedNode(node);
    setLoadingSimilar(true);
    try {
      const response = await getSimilarVideos(node.id, 6);
      setSimilarVideos(response.similar_videos);
    } catch {
      setSimilarVideos([]);
    } finally {
      setLoadingSimilar(false);
    }
  }, []);

  // Edge click handler
  const handleEdgeClick = useCallback(async (edge: SelectedEdge) => {
    // Clear other selections
    setSelectedNode(null);
    setSimilarVideos([]);
    setSelectedNodes([]);
    setSynthesis(null);
    setSelectedEdge(edge);
    setLoadingConnectionTheme(true);
    console.log("Edge clicked:", edge.source, edge.target);
    try {
      const response = await getConnectionTheme(edge.source, edge.target);
      console.log("Connection theme response:", response);
      setConnectionTheme(response);
    } catch (err) {
      // If API fails, create a fallback theme based on shared categories
      console.error("Connection theme API error:", err);
      const sharedCategories = edge.sourceNode.categories.filter(
        (cat) => edge.targetNode.categories.includes(cat)
      );
      setConnectionTheme({
        source_id: edge.source,
        target_id: edge.target,
        common_topics: sharedCategories.length > 0 ? sharedCategories : ["Related Content"],
        agreements: [],
        contradictions: [],
        similarity_score: 0.5,
      });
    } finally {
      setLoadingConnectionTheme(false);
    }
  }, []);

  // Multi-selection handler
  const handleSelectionChange = useCallback(async (nodes: GraphNode[]) => {
    if (nodes.length === 0) {
      setSelectedNodes([]);
      setSynthesis(null);
      return;
    }

    // Clear other selections
    setSelectedNode(null);
    setSimilarVideos([]);
    setSelectedEdge(null);
    setConnectionTheme(null);
    setSelectedNodes(nodes);

    if (nodes.length >= 2) {
      setLoadingSynthesis(true);
      try {
        const response = await synthesizeVideos(nodes.map((n) => n.id));
        setSynthesis(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to generate synthesis");
        setSynthesis(null);
      } finally {
        setLoadingSynthesis(false);
      }
    }
  }, []);

  // Close panel
  const handleClosePanel = useCallback(() => {
    setSelectedNode(null);
    setSelectedNodes([]);
    setSelectedEdge(null);
    setSimilarVideos([]);
    setSynthesis(null);
    setConnectionTheme(null);
  }, []);

  // Graph ready handler
  const handleGraphReady = useCallback((methods: KnowledgeGraphMethods) => {
    graphMethodsRef.current = methods;
  }, []);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(zoomLevel * 1.5, 8);
    graphMethodsRef.current?.zoom(newZoom, 300);
  }, [zoomLevel]);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(zoomLevel / 1.5, 0.1);
    graphMethodsRef.current?.zoom(newZoom, 300);
  }, [zoomLevel]);

  const handleZoomFit = useCallback(() => {
    graphMethodsRef.current?.zoomToFit(300, 50);
  }, []);

  // Get selected node IDs for the graph component
  const selectedNodeIds = hasMultiSelection
    ? selectedNodes.map((n) => n.id)
    : selectedNode
    ? [selectedNode.id]
    : [];

  // Filter nodes and edges when a single node is selected to show only connected videos
  const filteredGraphData = useMemo(() => {
    if (!selectedNode) {
      return { nodes, edges };
    }

    // Find all edges connected to the selected node
    const connectedEdges = edges.filter(
      (edge) => edge.source === selectedNode.id || edge.target === selectedNode.id
    );

    // Get IDs of all connected nodes
    const connectedNodeIds = new Set<string>([selectedNode.id]);
    connectedEdges.forEach((edge) => {
      connectedNodeIds.add(edge.source);
      connectedNodeIds.add(edge.target);
    });

    // Filter nodes to only include connected ones
    const connectedNodes = nodes.filter((node) => connectedNodeIds.has(node.id));

    return { nodes: connectedNodes, edges: connectedEdges };
  }, [selectedNode, nodes, edges]);

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] min-h-[500px] overflow-hidden">
      {/* Controls Bar */}
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {selectedNode
                ? `${filteredGraphData.nodes.length} connected videos`
                : `${nodes.length} videos, ${edges.length} connections`}
            </span>
            {selectedNode && (
              <button
                onClick={handleClosePanel}
                className="text-xs text-primary hover:underline"
              >
                Show all
              </button>
            )}
          </div>
          {stats?.computed_at && (
            <span className="text-xs text-muted-foreground">
              Last computed: {new Date(stats.computed_at).toLocaleString()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 w-56">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              Similarity:
            </span>
            <Slider
              value={[minSimilarity]}
              onValueChange={(v) => setMinSimilarity(v[0])}
              min={0.3}
              max={0.8}
              step={0.05}
              className="flex-1"
            />
            <span className="text-xs font-mono w-10">
              {Math.round(minSimilarity * 100)}%
            </span>
          </div>

          <Button
            onClick={handleComputeConnections}
            disabled={isComputing || isLoading}
            size="sm"
            variant="outline"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 mr-1.5 ${isComputing ? "animate-spin" : ""}`}
            />
            {isComputing ? "Computing..." : "Recompute"}
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/10 mb-4">
          <CardContent className="pt-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Main Content - Flex Layout */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Graph Container */}
        <div
          ref={containerRef}
          className="flex-1 min-w-0 border border-border rounded-lg bg-card"
          style={{
            position: "relative",
            minHeight: 400,
          }}
        >
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading graph...</p>
              </div>
            </div>
          ) : nodes.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <Zap className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  No connections computed yet
                </p>
                <Button onClick={handleComputeConnections} disabled={isComputing}>
                  <RefreshCw
                    className={`w-4 h-4 mr-2 ${isComputing ? "animate-spin" : ""}`}
                  />
                  Compute Connections
                </Button>
              </div>
            </div>
          ) : (
            <>
              <KnowledgeGraph
                nodes={filteredGraphData.nodes}
                edges={filteredGraphData.edges}
                selectedNodeId={selectedNode?.id || null}
                selectedNodeIds={selectedNodeIds}
                selectedEdge={selectedEdge}
                onNodeClick={handleNodeClick}
                onEdgeClick={handleEdgeClick}
                onSelectionChange={handleSelectionChange}
                onZoomChange={setZoomLevel}
                onGraphReady={handleGraphReady}
                width={dimensions.width}
                height={dimensions.height}
              />

              {/* Zoom Controls */}
              <div
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  zIndex: 10,
                }}
              >
                <button
                  onClick={handleZoomIn}
                  className="w-9 h-9 flex items-center justify-center rounded-md bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white transition-colors cursor-pointer"
                  title="Zoom in"
                >
                  <ZoomIn className="h-5 w-5" />
                </button>
                <div className="text-xs text-center text-zinc-400 font-mono py-1">
                  {Math.round(zoomLevel * 100)}%
                </div>
                <button
                  onClick={handleZoomOut}
                  className="w-9 h-9 flex items-center justify-center rounded-md bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white transition-colors cursor-pointer"
                  title="Zoom out"
                >
                  <ZoomOut className="h-5 w-5" />
                </button>
                <button
                  onClick={handleZoomFit}
                  className="w-9 h-9 flex items-center justify-center rounded-md bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white transition-colors cursor-pointer mt-1"
                  title="Fit to view"
                >
                  <Maximize2 className="h-5 w-5" />
                </button>
              </div>

              {/* Instructions */}
              <div
                className="text-xs text-zinc-500 bg-zinc-900/80 px-2 py-1 rounded"
                style={{
                  position: "absolute",
                  bottom: 12,
                  left: 12,
                }}
              >
                Scroll to zoom • Drag to pan • Click video or connection • Right-click drag to select
              </div>
            </>
          )}
        </div>

        {/* Detail Panel - Single Video */}
        {hasSingleSelection && selectedNode && (
          <Card className="w-[320px] h-full flex-shrink-0 overflow-hidden flex flex-col">
            <CardHeader className="pb-2 flex-shrink-0">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-sm font-medium line-clamp-2">
                  {selectedNode.title}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleClosePanel}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              <a
                href={selectedNode.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block mb-3"
              >
                <img
                  src={getYouTubeThumbnail(selectedNode.id)}
                  alt={selectedNode.title}
                  className="w-full rounded"
                />
              </a>

              <div className="flex flex-wrap gap-1 mb-3">
                {selectedNode.categories.map((cat) => (
                  <Badge
                    key={cat}
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 ${getCategoryColor(cat)}`}
                  >
                    {cat}
                  </Badge>
                ))}
              </div>

              {selectedNode.summary && (
                <p className="text-xs text-muted-foreground mb-4 line-clamp-3">
                  {selectedNode.summary}
                </p>
              )}

              <a
                href={selectedNode.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline mb-4"
              >
                Watch on YouTube
                <ExternalLink className="w-3 h-3" />
              </a>

              <div className="border-t border-border pt-3 mt-2">
                <h4 className="text-xs font-medium mb-2">Similar Videos</h4>
                {loadingSimilar ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : similarVideos.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No similar videos found
                  </p>
                ) : (
                  <div className="space-y-2">
                    {similarVideos.map((video) => (
                      <div
                        key={video.video_id}
                        className="flex gap-2 p-1.5 rounded hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => {
                          const node = nodes.find((n) => n.id === video.video_id);
                          if (node) handleNodeClick(node);
                        }}
                      >
                        <img
                          src={getYouTubeThumbnail(video.video_id)}
                          alt={video.title}
                          className="w-16 h-auto rounded flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-medium line-clamp-2 leading-tight">
                            {video.title}
                          </p>
                          <Badge
                            variant="outline"
                            className="text-[8px] px-1 py-0 mt-1 bg-primary/10 text-primary border-primary/30"
                          >
                            {Math.round(video.similarity * 100)}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Connection Theme Panel - Edge Selected */}
        {hasEdgeSelection && selectedEdge && (
          <Card className="w-[320px] h-full flex-shrink-0 overflow-hidden flex flex-col">
            <CardHeader className="pb-2 flex-shrink-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-blue-400" />
                  <CardTitle className="text-sm font-medium">
                    Connection Theme
                  </CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleClosePanel}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              {loadingConnectionTheme ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-20 w-full mt-4" />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Connected Videos */}
                  <div className="space-y-3">
                    {/* Source Video */}
                    <div className="flex gap-2 p-2 rounded bg-muted/30 border border-border">
                      <img
                        src={getYouTubeThumbnail(selectedEdge.sourceNode.id)}
                        alt={selectedEdge.sourceNode.title}
                        className="w-20 h-auto rounded flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium line-clamp-2 leading-tight">
                          {selectedEdge.sourceNode.title}
                        </p>
                        <div className="flex flex-wrap gap-0.5 mt-1">
                          {selectedEdge.sourceNode.categories.slice(0, 2).map((cat) => (
                            <Badge
                              key={cat}
                              variant="outline"
                              className={`text-[8px] px-1 py-0 ${getCategoryColor(cat)}`}
                            >
                              {cat}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Connection Indicator */}
                    <div className="flex items-center justify-center">
                      <div className="flex-1 h-px bg-blue-500/50" />
                      <div className="px-2 py-1 bg-blue-500/20 rounded-full border border-blue-500/30">
                        <Link2 className="w-3 h-3 text-blue-400" />
                      </div>
                      <div className="flex-1 h-px bg-blue-500/50" />
                    </div>

                    {/* Target Video */}
                    <div className="flex gap-2 p-2 rounded bg-muted/30 border border-border">
                      <img
                        src={getYouTubeThumbnail(selectedEdge.targetNode.id)}
                        alt={selectedEdge.targetNode.title}
                        className="w-20 h-auto rounded flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium line-clamp-2 leading-tight">
                          {selectedEdge.targetNode.title}
                        </p>
                        <div className="flex flex-wrap gap-0.5 mt-1">
                          {selectedEdge.targetNode.categories.slice(0, 2).map((cat) => (
                            <Badge
                              key={cat}
                              variant="outline"
                              className={`text-[8px] px-1 py-0 ${getCategoryColor(cat)}`}
                            >
                              {cat}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Connection Theme Info */}
                  {connectionTheme ? (
                    <>
                      {/* Common Topics */}
                      {connectionTheme.common_topics && connectionTheme.common_topics.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground mb-2">
                            Common Topics
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {connectionTheme.common_topics.map((topic, i) => (
                              <Badge
                                key={i}
                                variant="outline"
                                className="text-xs bg-blue-500/10 text-blue-400 border-blue-500/30"
                              >
                                {topic}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* What Both Videos Agree On */}
                      <div>
                        <h4 className="text-xs font-medium text-green-400 mb-2">
                          What Both Videos Agree On
                        </h4>
                        {connectionTheme.agreements && connectionTheme.agreements.length > 0 ? (
                          <ul className="space-y-1.5">
                            {connectionTheme.agreements.map((point, i) => (
                              <li key={i} className="text-xs text-foreground/80 leading-relaxed pl-3 border-l-2 border-green-500/30">
                                {point}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">
                            Click on a connection to generate analysis
                          </p>
                        )}
                      </div>

                      {/* What They Contradict */}
                      <div>
                        <h4 className="text-xs font-medium text-amber-400 mb-2">
                          What They Contradict
                        </h4>
                        {connectionTheme.contradictions && connectionTheme.contradictions.length > 0 ? (
                          <ul className="space-y-1.5">
                            {connectionTheme.contradictions.map((point, i) => (
                              <li key={i} className="text-xs text-foreground/80 leading-relaxed pl-3 border-l-2 border-amber-500/30">
                                {point}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">
                            Click on a connection to generate analysis
                          </p>
                        )}
                      </div>

                      {/* Similarity Score */}
                      <div className="flex items-center gap-2 pt-2 border-t border-border">
                        <span className="text-xs text-muted-foreground">Similarity:</span>
                        <Badge
                          variant="outline"
                          className="text-xs bg-primary/10 text-primary border-primary/30"
                        >
                          {Math.round(connectionTheme.similarity_score * 100)}%
                        </Badge>
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      Unable to generate connection theme. These videos are connected
                      based on their semantic similarity.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Synthesis Panel - Multiple Videos */}
        {hasMultiSelection && (
          <Card className="w-[320px] h-full flex-shrink-0 overflow-hidden flex flex-col">
            <CardHeader className="pb-2 flex-shrink-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <CardTitle className="text-sm font-medium">
                    Theme Synthesis
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {selectedNodes.length} videos
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleClosePanel}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              {loadingSynthesis ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                  <Skeleton className="h-20 w-full mt-4" />
                </div>
              ) : synthesis ? (
                <div className="space-y-4">
                  {synthesis.common_themes && synthesis.common_themes.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground mb-2">
                        Common Themes
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {synthesis.common_themes.map((theme, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="text-xs bg-primary/10 text-primary border-primary/30"
                          >
                            {theme}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2">
                      Synthesis
                    </h4>
                    <p className="text-sm text-foreground leading-relaxed">
                      {synthesis.synthesis}
                    </p>
                  </div>

                  <div className="border-t border-border pt-3">
                    <h4 className="text-xs font-medium text-muted-foreground mb-2">
                      Selected Videos
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedNodes.map((node) => (
                        <div
                          key={node.id}
                          className="flex gap-2 p-1.5 rounded bg-muted/30"
                        >
                          <img
                            src={getYouTubeThumbnail(node.id)}
                            alt={node.title}
                            className="w-12 h-auto rounded flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-medium line-clamp-2 leading-tight">
                              {node.title}
                            </p>
                            <div className="flex flex-wrap gap-0.5 mt-1">
                              {node.categories.slice(0, 2).map((cat) => (
                                <Badge
                                  key={cat}
                                  variant="outline"
                                  className={`text-[8px] px-1 py-0 ${getCategoryColor(cat)}`}
                                >
                                  {cat}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Select 2 or more videos to see a theme synthesis
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Category Legend */}
      <div className="mt-4 flex flex-wrap gap-2 items-center">
        <span className="text-xs text-muted-foreground mr-2">Categories:</span>
        {categories.slice(0, 10).map((cat) => (
          <button
            key={cat}
            onClick={() => {
              if (selectedCategories.includes(cat)) {
                onCategoryChange(selectedCategories.filter((c) => c !== cat));
              } else {
                onCategoryChange([...selectedCategories, cat]);
              }
            }}
            className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
              selectedCategories.includes(cat)
                ? getCategoryColor(cat)
                : "border-border text-muted-foreground hover:border-primary"
            }`}
          >
            {cat}
          </button>
        ))}
        {categories.length > 10 && (
          <span className="text-xs text-muted-foreground">
            +{categories.length - 10} more
          </span>
        )}
      </div>
    </div>
  );
}

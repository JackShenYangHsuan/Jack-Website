import { useRef, useMemo, useEffect, useCallback, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import type { GraphNode, GraphEdge } from "@/lib/api";

// ============================================================================
// TYPES
// ============================================================================

export interface SelectedEdge {
  source: string;
  target: string;
  sourceNode: GraphNode;
  targetNode: GraphNode;
}

interface KnowledgeGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodeId: string | null;
  selectedNodeIds: string[];
  selectedEdge: SelectedEdge | null;
  onNodeClick: (node: GraphNode) => void;
  onEdgeClick: (edge: SelectedEdge) => void;
  onSelectionChange: (nodes: GraphNode[]) => void;
  onZoomChange?: (zoom: number) => void;
  onGraphReady?: (methods: KnowledgeGraphMethods) => void;
  width: number;
  height: number;
}

export interface KnowledgeGraphMethods {
  zoom: (k: number, duration?: number) => void;
  zoomToFit: (duration?: number, padding?: number) => void;
  clearSelection: () => void;
}

interface SelectionCircle {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const THUMBNAIL_WIDTH = 140;
const THUMBNAIL_HEIGHT = 79;
const NODE_BORDER_WIDTH = 3;

const CATEGORY_COLORS: Record<string, string> = {
  Technology: "#3b82f6",
  Programming: "#a855f7",
  "AI/ML": "#06b6d4",
  Business: "#f59e0b",
  Finance: "#22c55e",
  Productivity: "#f97316",
  "Self-Improvement": "#ec4899",
  "Health/Fitness": "#ef4444",
  Entertainment: "#8b5cf6",
  Education: "#6366f1",
  News: "#64748b",
  Science: "#14b8a6",
  Design: "#f43f5e",
  Marketing: "#84cc16",
  Career: "#0ea5e9",
  Lifestyle: "#d946ef",
  Gaming: "#10b981",
  Music: "#eab308",
  Travel: "#06b6d4",
  Food: "#f97316",
  Sports: "#22c55e",
  Other: "#6b7280",
};

function getCategoryColor(categories: string[]): string {
  if (categories.length === 0) return CATEGORY_COLORS.Other;
  return CATEGORY_COLORS[categories[0]] || CATEGORY_COLORS.Other;
}

function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}

// ============================================================================
// IMAGE CACHE
// ============================================================================

const imageCache = new Map<string, HTMLImageElement>();

function loadImage(src: string): HTMLImageElement | null {
  if (imageCache.has(src)) {
    const img = imageCache.get(src)!;
    return img.complete ? img : null;
  }

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = src;
  imageCache.set(src, img);
  return null;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function KnowledgeGraph({
  nodes,
  edges,
  selectedNodeIds,
  selectedEdge,
  onNodeClick,
  onEdgeClick,
  onSelectionChange,
  onZoomChange,
  onGraphReady,
  width,
  height,
}: KnowledgeGraphProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const graphRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [selectionCircle, setSelectionCircle] = useState<SelectionCircle | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const selectionStartRef = useRef<{ x: number; y: number } | null>(null);

  // Create a map for quick node lookup
  const nodeMap = useMemo(() => {
    const map = new Map<string, GraphNode>();
    nodes.forEach((node) => map.set(node.id, node));
    return map;
  }, [nodes]);

  // Determine which nodes are connected to selected edge
  const connectedNodeIds = useMemo(() => {
    if (!selectedEdge) return new Set<string>();
    return new Set([selectedEdge.source, selectedEdge.target]);
  }, [selectedEdge]);

  // Preload all thumbnails
  useEffect(() => {
    nodes.forEach((node) => {
      loadImage(getYouTubeThumbnail(node.id));
    });
  }, [nodes]);

  // Transform data for force-graph
  const graphData = useMemo(
    () => ({
      nodes: nodes.map((node) => ({
        id: node.id,
        name: node.title,
        color: getCategoryColor(node.categories),
        category: node.categories[0] || "Other",
        _original: node,
      })),
      links: edges.map((edge) => ({
        source: edge.source,
        target: edge.target,
        weight: edge.weight,
      })),
    }),
    [nodes, edges]
  );

  // Notify parent when graph is ready
  useEffect(() => {
    if (graphRef.current && !isReady) {
      setIsReady(true);
      onGraphReady?.({
        zoom: (k, duration) => graphRef.current?.zoom(k, duration),
        zoomToFit: (duration, padding) => graphRef.current?.zoomToFit(duration ?? 400, padding ?? 50),
        clearSelection: () => onSelectionChange([]),
      });
    }
  }, [isReady, onGraphReady, onSelectionChange]);

  // Initial zoom to fit
  useEffect(() => {
    if (graphRef.current && nodes.length > 0) {
      const timer = setTimeout(() => {
        graphRef.current?.zoomToFit(400, 50);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [nodes.length]);

  // Handle node click
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleNodeClick = useCallback((node: any) => {
    if (node?._original && !isSelecting) {
      onNodeClick(node._original);
    }
  }, [onNodeClick, isSelecting]);

  // Handle link click
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleLinkClick = useCallback((link: any) => {
    const sourceId = typeof link.source === "object" ? link.source.id : link.source;
    const targetId = typeof link.target === "object" ? link.target.id : link.target;

    const sourceNode = nodeMap.get(sourceId);
    const targetNode = nodeMap.get(targetId);

    if (sourceNode && targetNode) {
      onEdgeClick({
        source: sourceId,
        target: targetId,
        sourceNode,
        targetNode,
      });
    }
  }, [nodeMap, onEdgeClick]);

  // Draw thumbnail nodes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const x = node.x;
    const y = node.y;
    if (x === undefined || y === undefined) return;
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;

    // Check if this node should be dimmed (when edge is selected but node is not connected)
    const isDimmed = selectedEdge && !connectedNodeIds.has(node.id);

    // Scale thumbnail size based on zoom level
    const scale = Math.max(0.5, Math.min(2, globalScale));
    const thumbWidth = THUMBNAIL_WIDTH / scale;
    const thumbHeight = THUMBNAIL_HEIGHT / scale;
    const borderWidth = NODE_BORDER_WIDTH / scale;

    const halfWidth = thumbWidth / 2;
    const halfHeight = thumbHeight / 2;
    const isSelected = selectedNodeIds.includes(node.id) || connectedNodeIds.has(node.id);
    const borderColor = node.color || "#6b7280";

    // Apply dimming
    if (isDimmed) {
      ctx.globalAlpha = 0.2;
    }

    // Draw selection highlight
    if (isSelected && !isDimmed) {
      const highlightPadding = 4 / scale;
      ctx.fillStyle = `${borderColor}40`;
      ctx.fillRect(
        x - halfWidth - highlightPadding,
        y - halfHeight - highlightPadding,
        thumbWidth + highlightPadding * 2,
        thumbHeight + highlightPadding * 2
      );
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 3 / scale;
      ctx.strokeRect(
        x - halfWidth - highlightPadding,
        y - halfHeight - highlightPadding,
        thumbWidth + highlightPadding * 2,
        thumbHeight + highlightPadding * 2
      );
    }

    // Draw border
    ctx.fillStyle = borderColor;
    ctx.fillRect(
      x - halfWidth - borderWidth,
      y - halfHeight - borderWidth,
      thumbWidth + borderWidth * 2,
      thumbHeight + borderWidth * 2
    );

    // Draw thumbnail
    const thumbnailSrc = getYouTubeThumbnail(node.id);
    const img = loadImage(thumbnailSrc);

    if (img && img.complete && img.naturalWidth > 0) {
      try {
        ctx.drawImage(img, x - halfWidth, y - halfHeight, thumbWidth, thumbHeight);
      } catch {
        ctx.fillStyle = "#1f2937";
        ctx.fillRect(x - halfWidth, y - halfHeight, thumbWidth, thumbHeight);
      }
    } else {
      ctx.fillStyle = "#1f2937";
      ctx.fillRect(x - halfWidth, y - halfHeight, thumbWidth, thumbHeight);

      ctx.fillStyle = "#4b5563";
      ctx.beginPath();
      ctx.arc(x, y, 8 / scale, 0, Math.PI * 2);
      ctx.fill();
    }

    // Reset alpha
    if (isDimmed) {
      ctx.globalAlpha = 1;
    }
  }, [selectedNodeIds, selectedEdge, connectedNodeIds]);

  // Hit area for nodes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nodePointerAreaPaint = useCallback((node: any, color: string, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const x = node.x;
    const y = node.y;
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;

    const scale = Math.max(0.5, Math.min(2, globalScale));
    const thumbWidth = THUMBNAIL_WIDTH / scale;
    const thumbHeight = THUMBNAIL_HEIGHT / scale;

    ctx.fillStyle = color;
    ctx.fillRect(
      x - thumbWidth / 2,
      y - thumbHeight / 2,
      thumbWidth,
      thumbHeight
    );
  }, []);

  // Link pointer area - make edges easier to click
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const linkPointerAreaPaint = useCallback((link: any, color: string, ctx: CanvasRenderingContext2D) => {
    const sourceX = link.source.x;
    const sourceY = link.source.y;
    const targetX = link.target.x;
    const targetY = link.target.y;

    if (!Number.isFinite(sourceX) || !Number.isFinite(sourceY) ||
        !Number.isFinite(targetX) || !Number.isFinite(targetY)) return;

    // Draw a thick invisible line for easier clicking
    ctx.strokeStyle = color;
    ctx.lineWidth = 20; // Wide clickable area
    ctx.beginPath();
    ctx.moveTo(sourceX, sourceY);
    ctx.lineTo(targetX, targetY);
    ctx.stroke();
  }, []);

  // Custom link rendering
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const linkCanvasObject = useCallback((link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const sourceX = link.source.x;
    const sourceY = link.source.y;
    const targetX = link.target.x;
    const targetY = link.target.y;

    if (!Number.isFinite(sourceX) || !Number.isFinite(sourceY) ||
        !Number.isFinite(targetX) || !Number.isFinite(targetY)) return;

    const sourceId = typeof link.source === "object" ? link.source.id : link.source;
    const targetId = typeof link.target === "object" ? link.target.id : link.target;

    // Check if this is the selected edge
    const isSelectedEdge = selectedEdge &&
      ((selectedEdge.source === sourceId && selectedEdge.target === targetId) ||
       (selectedEdge.source === targetId && selectedEdge.target === sourceId));

    // Check if edge should be dimmed
    const isDimmed = selectedEdge && !isSelectedEdge;

    ctx.beginPath();
    ctx.moveTo(sourceX, sourceY);
    ctx.lineTo(targetX, targetY);

    if (isSelectedEdge) {
      // Highlighted selected edge
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 4 / globalScale;
      ctx.shadowColor = "#3b82f6";
      ctx.shadowBlur = 10;
    } else if (isDimmed) {
      // Dimmed non-selected edges
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 1 / globalScale;
    } else {
      // Normal edges
      ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
      ctx.lineWidth = 2 / globalScale;
    }

    ctx.stroke();

    // Reset shadow
    if (isSelectedEdge) {
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
    }
  }, [selectedEdge]);

  // Draw selection circle overlay
  const onRenderFramePost = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!selectionCircle) return;

    const { startX, startY, endX, endY } = selectionCircle;
    const centerX = (startX + endX) / 2;
    const centerY = (startY + endY) / 2;
    const radiusX = Math.abs(endX - startX) / 2;
    const radiusY = Math.abs(endY - startY) / 2;
    const radius = Math.max(radiusX, radiusY);

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(59, 130, 246, 0.15)";
    ctx.fill();
    ctx.strokeStyle = "rgba(59, 130, 246, 0.8)";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [selectionCircle]);

  // Handle background click
  const handleBackgroundClick = useCallback(() => {
    if (isSelecting && selectionCircle && graphRef.current) {
      const { startX, startY, endX, endY } = selectionCircle;
      const centerX = (startX + endX) / 2;
      const centerY = (startY + endY) / 2;
      const radius = Math.max(Math.abs(endX - startX), Math.abs(endY - startY)) / 2;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const graphNodes = graphRef.current.graphData()?.nodes || [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const selectedNodes = graphNodes.filter((node: any) => {
        if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) return false;
        const dx = node.x - centerX;
        const dy = node.y - centerY;
        return Math.sqrt(dx * dx + dy * dy) <= radius;
      });

      if (selectedNodes.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onSelectionChange(selectedNodes.map((n: any) => n._original));
      }

      setSelectionCircle(null);
      setIsSelecting(false);
      selectionStartRef.current = null;
    }
  }, [isSelecting, selectionCircle, onSelectionChange]);

  // Setup canvas event listeners for selection
  useEffect(() => {
    if (!graphRef.current) return;

    const canvas = graphRef.current.canvas?.();
    if (!canvas) return;

    const handleMouseMove = (event: MouseEvent) => {
      if (!isSelecting || !selectionStartRef.current || !graphRef.current) return;

      const graphCoords = graphRef.current.screen2GraphCoords(event.offsetX, event.offsetY);

      setSelectionCircle((prev) => prev ? {
        ...prev,
        endX: graphCoords.x,
        endY: graphCoords.y,
      } : null);
    };

    const handleMouseUp = () => {
      if (isSelecting && selectionCircle && graphRef.current) {
        const { startX, startY, endX, endY } = selectionCircle;
        const centerX = (startX + endX) / 2;
        const centerY = (startY + endY) / 2;
        const radius = Math.max(Math.abs(endX - startX), Math.abs(endY - startY)) / 2;

        if (radius > 10) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const graphNodes = graphRef.current.graphData()?.nodes || [];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const selectedNodes = graphNodes.filter((node: any) => {
            if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) return false;
            const dx = node.x - centerX;
            const dy = node.y - centerY;
            return Math.sqrt(dx * dx + dy * dy) <= radius;
          });

          if (selectedNodes.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onSelectionChange(selectedNodes.map((n: any) => n._original));
          }
        }

        setSelectionCircle(null);
        setIsSelecting(false);
        selectionStartRef.current = null;
      }
    };

    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault();
      if (!graphRef.current) return;

      const graphCoords = graphRef.current.screen2GraphCoords(event.offsetX, event.offsetY);

      selectionStartRef.current = { x: graphCoords.x, y: graphCoords.y };
      setIsSelecting(true);
      setSelectionCircle({
        startX: graphCoords.x,
        startY: graphCoords.y,
        endX: graphCoords.x,
        endY: graphCoords.y,
      });
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("contextmenu", handleContextMenu);

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [isSelecting, selectionCircle, onSelectionChange]);

  if (nodes.length === 0) {
    return (
      <div style={{ width, height, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p className="text-muted-foreground">No connections to display.</p>
      </div>
    );
  }

  // Configure forces after graph is ready
  useEffect(() => {
    if (graphRef.current && isReady) {
      const fg = graphRef.current;

      // Strong repulsion between nodes to spread them out (scaled for larger thumbnails)
      const chargeForce = fg.d3Force("charge");
      if (chargeForce) {
        chargeForce.strength(-4000);
        chargeForce.distanceMin(THUMBNAIL_WIDTH + 50);
        chargeForce.distanceMax(1200);
      }

      // Increase link distance significantly for larger thumbnails
      const linkForce = fg.d3Force("link");
      if (linkForce) {
        linkForce.distance(THUMBNAIL_WIDTH * 2.5);
        linkForce.strength(0.2);
      }

      // Weaken center force so nodes spread more
      const centerForce = fg.d3Force("center");
      if (centerForce && typeof centerForce.strength === "function") {
        centerForce.strength(0.01);
      }

      // Reheat simulation to apply changes
      fg.d3ReheatSimulation();

      // After simulation settles, zoom to fit
      setTimeout(() => {
        fg.zoomToFit(400, 80);
      }, 600);
    }
  }, [isReady, nodes.length]);

  return (
    <ForceGraph2D
      ref={graphRef}
      graphData={graphData}
      width={width}
      height={height}
      nodeCanvasObject={nodeCanvasObject}
      nodeCanvasObjectMode={() => "replace"}
      nodePointerAreaPaint={nodePointerAreaPaint}
      linkCanvasObject={linkCanvasObject}
      linkCanvasObjectMode={() => "replace"}
      linkPointerAreaPaint={linkPointerAreaPaint}
      onRenderFramePost={onRenderFramePost}
      onNodeClick={handleNodeClick}
      onLinkClick={handleLinkClick}
      onBackgroundClick={handleBackgroundClick}
      onZoom={({ k }) => onZoomChange?.(k)}
      backgroundColor="transparent"
      enableNodeDrag={!isSelecting}
      enableZoomInteraction={true}
      enablePanInteraction={!isSelecting}
      d3AlphaDecay={0.02}
      d3VelocityDecay={0.3}
      linkDirectionalParticles={0}
      warmupTicks={200}
      cooldownTicks={300}
      minZoom={0.2}
      maxZoom={5}
    />
  );
}

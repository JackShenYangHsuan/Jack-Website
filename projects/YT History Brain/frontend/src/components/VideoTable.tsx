import { useState, useEffect, useRef } from "react";
import type { Video } from "@/lib/api";
import { processSingleVideo } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronUp, Link2, Trash2, Calendar, Play, Loader2 } from "lucide-react";
import { getCategoryTailwindClasses } from "@/lib/constants";

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    let date: Date;

    // Handle MM/DD/YYYY format
    if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(dateStr)) {
      const parts = dateStr.split("/");
      date = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
    } else {
      date = new Date(dateStr);
    }

    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

interface VideoTableProps {
  videos: Video[];
  isLoading: boolean;
  onVideoSelect?: (video: Video) => void;
  onDeleteVideo?: (videoId: string) => void;
  onVideoProcessed?: (video: Video) => void;
}

interface ContextMenuState {
  show: boolean;
  x: number;
  y: number;
  video: Video | null;
}

function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}

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

function getStatus(video: { summary: string }): { label: string; color: string } {
  const summary = video.summary || "";

  // Complete: Has proper summary (transcript_available check removed - unreliable for old data)
  if (hasProperSummary(summary)) {
    return { label: "Complete", color: "bg-green-500 text-green-950" };
  }

  // Pending: Everything else (no summary, title-based summaries)
  return { label: "Pending", color: "bg-yellow-500 text-yellow-950" };
}

// Use centralized category colors
const getCategoryColor = getCategoryTailwindClasses;

function VideoCard({
  video,
  onSelect,
  onContextMenu,
  onProcess
}: {
  video: Video;
  onSelect?: (video: Video) => void;
  onContextMenu?: (e: React.MouseEvent, video: Video) => void;
  onProcess?: (video: Video) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const status = getStatus(video);
  const hasSummary = video.summary && video.summary !== "No summary available.";
  const isPending = status.label === "Pending";

  const handleProcess = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      const result = await processSingleVideo(video.video_id);
      if (result.success && onProcess) {
        onProcess(result.video);
      }
    } catch (error) {
      console.error("Failed to process video:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onContextMenu?.(e, video);
  };

  return (
    <div
      className="border border-border rounded overflow-hidden bg-card hover:bg-muted/30 transition-colors"
      onContextMenu={handleContextMenu}
    >
      {/* Thumbnail with Status Overlay */}
      <div className="relative group">
        <a
          href={video.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <img
            src={getYouTubeThumbnail(video.video_id)}
            alt={video.title}
            className="w-full h-auto"
          />
        </a>
        {/* Status Badge - Top Right */}
        <div className="absolute top-1 right-1">
          <Badge className={`text-[8px] px-1 py-0 font-medium ${status.color}`}>
            {status.label}
          </Badge>
        </div>
        {/* Related Videos Button - Bottom Right (show on hover) */}
        {onSelect && hasSummary && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelect(video);
            }}
            className="absolute bottom-1 right-1 p-1 rounded bg-primary/90 text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary"
            title="Find related videos"
          >
            <Link2 className="w-3 h-3" />
          </button>
        )}
        {/* Process Button - Bottom Left (show for pending videos) */}
        {isPending && (
          <button
            onClick={handleProcess}
            disabled={isProcessing}
            className="absolute bottom-1 left-1 p-1 rounded bg-green-600/90 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-green-600 disabled:opacity-50"
            title="Process this video"
          >
            {isProcessing ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Play className="w-3 h-3" />
            )}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-2">
        {/* Title */}
        <a
          href={video.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block mb-1"
        >
          <h3 className="text-[11px] font-medium text-foreground hover:text-primary line-clamp-2 leading-tight">
            {video.title}
          </h3>
        </a>

        {/* Date */}
        {video.watched_at && (
          <div className="flex items-center gap-1 mb-1 text-[9px] text-muted-foreground">
            <Calendar className="w-2.5 h-2.5" />
            {formatDate(video.watched_at)}
          </div>
        )}

        {/* Summary */}
        {hasSummary ? (
          <div className="mb-1">
            <p className={`text-[10px] text-muted-foreground leading-snug ${expanded ? "" : "line-clamp-2"}`}>
              {video.summary}
            </p>
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-0.5 text-[10px] text-primary hover:text-primary/80 mt-0.5"
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-2.5 h-2.5" />
                  Less
                </>
              ) : (
                <>
                  <ChevronDown className="w-2.5 h-2.5" />
                  More
                </>
              )}
            </button>
          </div>
        ) : (
          <p className="text-[10px] text-muted-foreground/50 italic mb-1">
            Pending
          </p>
        )}

        {/* Categories */}
        {video.categories.length > 0 && (
          <div className="flex flex-wrap gap-0.5">
            {video.categories.map((category) => (
              <Badge
                key={category}
                variant="outline"
                className={`text-[8px] px-1 py-0 ${getCategoryColor(category)}`}
              >
                {category}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="border border-border rounded overflow-hidden bg-card">
      <Skeleton className="w-full h-20" />
      <div className="p-2">
        <Skeleton className="h-3 w-full mb-1" />
        <Skeleton className="h-3 w-3/4 mb-2" />
        <Skeleton className="h-2 w-full mb-0.5" />
        <Skeleton className="h-2 w-2/3 mb-2" />
        <div className="flex gap-0.5">
          <Skeleton className="h-3 w-10 rounded-full" />
          <Skeleton className="h-3 w-8 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function VideoTable({ videos, isLoading, onVideoSelect, onDeleteVideo, onVideoProcessed }: VideoTableProps) {
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    show: false,
    x: 0,
    y: 0,
    video: null,
  });
  const menuRef = useRef<HTMLDivElement>(null);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu((prev) => ({ ...prev, show: false }));
      }
    };
    if (contextMenu.show) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [contextMenu.show]);

  const handleContextMenu = (e: React.MouseEvent, video: Video) => {
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      video,
    });
  };

  const handleDelete = () => {
    if (contextMenu.video && onDeleteVideo) {
      onDeleteVideo(contextMenu.video.video_id);
    }
    setContextMenu((prev) => ({ ...prev, show: false }));
  };

  if (isLoading && videos.length === 0) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
        {[...Array(16)].map((_, i) => (
          <LoadingCard key={i} />
        ))}
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="border border-border rounded-lg p-8 text-center">
        <p className="text-muted-foreground text-sm">
          No videos processed yet. Click "Process Videos" to start.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
        {videos.map((video) => (
          <VideoCard
            key={video.video_id}
            video={video}
            onSelect={onVideoSelect}
            onContextMenu={handleContextMenu}
            onProcess={onVideoProcessed}
          />
        ))}
      </div>

      {/* Context Menu */}
      {contextMenu.show && (
        <div
          ref={menuRef}
          className="fixed z-50 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[140px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={handleDelete}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete Video
          </button>
        </div>
      )}
    </>
  );
}

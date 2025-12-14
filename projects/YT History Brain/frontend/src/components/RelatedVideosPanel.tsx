import { useState, useEffect } from "react";
import type { SimilarVideo, Video } from "@/lib/api";
import { getSimilarVideos } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { X, ExternalLink, Link2 } from "lucide-react";
import { getCategoryTailwindClasses } from "@/lib/constants";

interface RelatedVideosPanelProps {
  video: Video;
  onClose: () => void;
  onSelectVideo: (videoId: string) => void;
}

function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}

// Use centralized category colors
const getCategoryColor = getCategoryTailwindClasses;

function SimilarVideoCard({
  video,
  onClick,
}: {
  video: SimilarVideo;
  onClick: () => void;
}) {
  return (
    <div
      className="flex gap-3 p-2 rounded-lg border border-border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <img
        src={getYouTubeThumbnail(video.video_id)}
        alt={video.title}
        className="w-24 h-auto rounded flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-medium text-foreground line-clamp-2 leading-tight">
            {video.title}
          </h4>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 flex-shrink-0 bg-primary/10 text-primary border-primary/30">
            {Math.round(video.similarity * 100)}%
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
          {video.summary}
        </p>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {video.categories.slice(0, 3).map((cat) => (
            <Badge
              key={cat}
              variant="outline"
              className={`text-[9px] px-1 py-0 ${getCategoryColor(cat)}`}
            >
              {cat}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-3 p-2 rounded-lg border border-border">
          <Skeleton className="w-24 h-14 rounded flex-shrink-0" />
          <div className="flex-1">
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-3 w-3/4 mb-2" />
            <div className="flex gap-1">
              <Skeleton className="h-4 w-12 rounded-full" />
              <Skeleton className="h-4 w-10 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function RelatedVideosPanel({
  video,
  onClose,
  onSelectVideo,
}: RelatedVideosPanelProps) {
  const [similarVideos, setSimilarVideos] = useState<SimilarVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSimilar = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await getSimilarVideos(video.video_id, 8);
        setSimilarVideos(response.similar_videos);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load similar videos");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSimilar();
  }, [video.video_id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background border border-border rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col m-4">
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-border">
          <div className="flex gap-3 flex-1 min-w-0">
            <img
              src={getYouTubeThumbnail(video.video_id)}
              alt={video.title}
              className="w-20 h-auto rounded flex-shrink-0"
            />
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground line-clamp-2 text-sm">
                {video.title}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Link2 className="w-3 h-3 text-primary" />
                <span className="text-xs text-muted-foreground">Related Videos</span>
              </div>
              <a
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
              >
                Watch on YouTube
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <LoadingSkeleton />
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-sm text-destructive">{error}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Make sure connections have been precomputed.
              </p>
            </div>
          ) : similarVideos.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                No similar videos found.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Try precomputing connections first.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground mb-3">
                {similarVideos.length} videos similar to this one based on content
              </p>
              {similarVideos.map((similar) => (
                <SimilarVideoCard
                  key={similar.video_id}
                  video={similar}
                  onClick={() => onSelectVideo(similar.video_id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border bg-muted/30">
          <p className="text-[10px] text-muted-foreground text-center">
            Click on a video to see its related videos
          </p>
        </div>
      </div>
    </div>
  );
}

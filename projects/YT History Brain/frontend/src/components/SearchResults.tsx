import { useState } from "react";
import type { SearchResult } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, ExternalLink, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { getCategoryTailwindClasses } from "@/lib/constants";

interface SearchResultsProps {
  synthesis: string;
  results: SearchResult[];
  onClose: () => void;
}

// Use centralized category colors
const getCategoryColor = getCategoryTailwindClasses;

function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}

function formatRelevanceScore(distance: number): { label: string; color: string } {
  // Distance is cosine distance, lower is better (0-2 range)
  // Convert to relevance percentage (rough approximation)
  const relevance = Math.max(0, Math.min(100, (1 - distance / 2) * 100));

  if (relevance >= 80) return { label: "Highly Relevant", color: "text-green-400" };
  if (relevance >= 60) return { label: "Relevant", color: "text-blue-400" };
  if (relevance >= 40) return { label: "Somewhat Relevant", color: "text-yellow-400" };
  return { label: "Low Relevance", color: "text-gray-400" };
}

function ResultCard({ result, index }: { result: SearchResult; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const relevance = formatRelevanceScore(result.distance);

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card hover:bg-muted/30 transition-colors">
      <div className="flex gap-3 p-3">
        {/* Thumbnail */}
        <a
          href={result.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0"
        >
          <img
            src={getYouTubeThumbnail(result.video_id)}
            alt={result.title}
            className="w-24 h-auto rounded"
          />
        </a>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title with index */}
          <div className="flex items-start gap-2 mb-1">
            <span className="flex-shrink-0 text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
              [{index + 1}]
            </span>
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-foreground hover:text-primary line-clamp-2 flex items-center gap-1"
            >
              {result.title}
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
            </a>
          </div>

          {/* Relevance and Categories */}
          <div className="flex flex-wrap items-center gap-1 mb-2">
            <span className={`text-[10px] ${relevance.color}`}>
              {relevance.label}
            </span>
            {result.categories.filter(c => c).map((category) => (
              <Badge
                key={category}
                variant="outline"
                className={`text-[9px] px-1 py-0 ${getCategoryColor(category)}`}
              >
                {category}
              </Badge>
            ))}
          </div>

          {/* Summary */}
          <p className={`text-xs text-muted-foreground leading-relaxed ${expanded ? "" : "line-clamp-2"}`}>
            {result.summary}
          </p>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-0.5 text-[10px] text-primary hover:text-primary/80 mt-1"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3 h-3" />
                Less
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                More
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function SearchResults({ synthesis, results, onClose }: SearchResultsProps) {
  return (
    <div className="border border-primary/30 rounded-lg bg-card/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-primary/10 border-b border-primary/20">
        <h3 className="text-sm font-semibold text-foreground">
          Search Results ({results.length} videos)
        </h3>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Synthesis */}
      <div className="p-4 border-b border-border bg-muted/30">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          AI Synthesis
        </h4>
        <div className="text-sm text-foreground leading-relaxed [&_p]:my-2 [&_strong]:font-semibold [&_ol]:list-decimal [&_ol]:ml-4 [&_ol]:my-2 [&_ul]:list-disc [&_ul]:ml-4 [&_ul]:my-2 [&_li]:my-1">
          <ReactMarkdown>{synthesis}</ReactMarkdown>
        </div>
      </div>

      {/* Results Grid */}
      <div className="p-4">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Matching Videos
        </h4>
        <div className="space-y-3">
          {results.map((result, index) => (
            <ResultCard key={result.video_id} result={result} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
}

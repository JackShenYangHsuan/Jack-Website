import type { ChannelStat } from "@/lib/api";

interface ChannelStatsProps {
  stats: ChannelStat[];
  totalVideos: number;
  totalChannels: number;
  isLoading: boolean;
}


export function ChannelStats({ stats, totalVideos, totalChannels, isLoading }: ChannelStatsProps) {
  if (isLoading) {
    return (
      <div className="border border-border rounded-lg p-4 bg-card">
        <div className="h-4 w-32 bg-muted animate-pulse rounded mb-4" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-6 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (stats.length === 0) {
    return null;
  }

  // Find max count for scaling bars
  const maxCount = Math.max(...stats.map((s) => s.count));

  return (
    <div className="border border-border rounded-lg p-4 bg-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">Top Creators</h3>
        <span className="text-xs text-muted-foreground">{totalChannels} channels</span>
      </div>

      <div className="space-y-1.5">
        {stats.map((stat) => {
          const barWidth = maxCount > 0 ? (stat.count / maxCount) * 100 : 0;

          return (
            <div key={stat.channel} className="group">
              <div className="flex items-center gap-2">
                {/* Channel name */}
                <div className="w-36 text-xs text-muted-foreground truncate" title={stat.channel}>
                  {stat.channel}
                </div>

                {/* Bar */}
                <div className="flex-1 h-5 bg-muted/30 rounded overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300 rounded"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>

                {/* Count and percentage */}
                <div className="w-16 text-right">
                  <span className="text-xs font-medium text-foreground">{stat.count}</span>
                  <span className="text-xs text-muted-foreground ml-1">({stat.percentage}%)</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

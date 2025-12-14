import type { ProcessingStatus } from "@/lib/api";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProcessingProgressProps {
  status: ProcessingStatus;
}

export function ProcessingProgress({ status }: ProcessingProgressProps) {
  const percentage = status.total > 0 ? (status.processed / status.total) * 100 : 0;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
          </span>
          Processing Videos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={percentage} className="h-2" />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>
            {status.processed} of {status.total} videos
          </span>
          <span>{Math.round(percentage)}%</span>
        </div>
        {status.current_video && (
          <p className="text-xs text-muted-foreground truncate">
            Currently processing: {status.current_title || status.current_video}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

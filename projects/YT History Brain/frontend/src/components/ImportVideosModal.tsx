import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Upload } from "lucide-react";

interface ImportVideosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (videos: { url: string; date: string }[]) => Promise<void>;
}

export function ImportVideosModal({ isOpen, onClose, onImport }: ImportVideosModalProps) {
  const [pasteData, setPasteData] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ url: string; date: string }[]>([]);

  if (!isOpen) return null;

  const parseData = (data: string) => {
    const lines = data.trim().split("\n");
    const parsed: { url: string; date: string }[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;

      // Split by tab (Excel copy) or multiple spaces
      const parts = line.split(/\t+|\s{2,}/);

      if (parts.length >= 2) {
        const url = parts[0].trim();
        const date = parts[1].trim();

        // Validate URL contains youtube
        if (url.includes("youtube.com") || url.includes("youtu.be")) {
          parsed.push({ url, date });
        }
      }
    }

    return parsed;
  };

  const handlePasteChange = (value: string) => {
    setPasteData(value);
    setError(null);

    const parsed = parseData(value);
    setPreview(parsed);
  };

  const handleImport = async () => {
    if (preview.length === 0) {
      setError("No valid videos found. Make sure each line has a YouTube URL and date separated by tab.");
      return;
    }

    try {
      setIsImporting(true);
      setError(null);
      await onImport(preview);
      setPasteData("");
      setPreview([]);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setPasteData("");
    setPreview([]);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-card border border-border rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Import Videos</h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-muted rounded"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Paste from Excel (URL and Date columns)
            </label>
            <textarea
              value={pasteData}
              onChange={(e) => handlePasteChange(e.target.value)}
              placeholder="Paste your data here...&#10;&#10;Example:&#10;https://youtube.com/watch?v=abc123    2024-01-15&#10;https://youtu.be/xyz789    2024-01-16"
              className="w-full h-40 p-3 text-sm bg-background border border-border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Each line should have a YouTube URL and date, separated by a tab or spaces.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/50 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {preview.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">
                Preview ({preview.length} videos)
              </h3>
              <div className="border border-border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-2 text-muted-foreground font-medium">URL</th>
                      <th className="text-left p-2 text-muted-foreground font-medium w-32">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 5).map((item, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="p-2 text-foreground truncate max-w-xs">{item.url}</td>
                        <td className="p-2 text-muted-foreground">{item.date}</td>
                      </tr>
                    ))}
                    {preview.length > 5 && (
                      <tr className="border-t border-border">
                        <td colSpan={2} className="p-2 text-center text-muted-foreground">
                          ... and {preview.length - 5} more
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-border">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={isImporting || preview.length === 0}
          >
            <Upload className="w-4 h-4 mr-2" />
            {isImporting ? "Importing..." : `Import ${preview.length} Videos`}
          </Button>
        </div>
      </div>
    </div>
  );
}

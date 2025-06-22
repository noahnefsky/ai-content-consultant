import { useState, useRef, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Upload,
  Video,
  FileVideo,
  Loader2,
  CheckCircle,
  AlertCircle,
  Download,
  Copy,
  FileText,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useVideoTransform } from "@/hooks/use-video-transform";
import { MediaType, MediaTypeSelector } from "./MediaTypeSelector";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const PLATFORM_ICONS: Record<string, string> = {
  tiktok: "🎵",
  instagram: "📸",
  twitter: "🐦",
  default: "📱",
};

const formatFileSize = (bytes: number) => {
  if (!bytes) return "0 Bytes";
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

export const MediaTransformPanel: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [targetPlatform, setTargetPlatform] = useState<MediaType>("tiktok");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { loading, error, result, transformVideo, clearResult, clearError } = useVideoTransform();

  const handleSelectFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    if (selected?.type.startsWith("video/")) {
      setFile(selected);
      clearResult();
      clearError();
    }
  }, [clearError, clearResult]);

  const triggerFilePicker = () => fileInputRef.current?.click();

  const handleTransform = async () => {
    if (!file) return;
    await transformVideo({ video: file, targetPlatform });
  };

  const handleDownload = () => {
    result?.clipFilenames?.forEach((name) => {
      const link = document.createElement("a");
      link.href = `${API_BASE_URL}/download-clip/${name}`;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  return (
    <Card className="h-full bg-black/50 backdrop-blur-lg border-zinc-800 shadow-xl flex flex-col">
      <CardHeader className="flex justify-between items-center border-b border-zinc-700 p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Media Transformer</h2>
            <p className="text-sm text-zinc-400">Upload and optimize your videos for social media</p>
          </div>
        </div>

      </CardHeader>

      <CardContent className="space-y-6 p-6 overflow-y-auto">
        {/* Upload Section */}
        <div className="border-2 border-dashed border-zinc-700 rounded-lg p-6 text-center hover:border-zinc-600 transition">
          {file ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileVideo className="w-8 h-8 text-green-400" />
                <div className="text-left">
                  <p className="font-medium text-white">{file.name}</p>
                  <p className="text-xs text-zinc-400">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setFile(null)}>
                Remove
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Upload className="w-8 h-8 text-zinc-400 mx-auto" />
              <p className="text-sm text-white">Click or drag file to upload</p>
              <p className="text-xs text-zinc-400">MP4, MOV, AVI up to 100MB</p>
              <Button onClick={triggerFilePicker}>Choose File</Button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleSelectFile}
          />
        </div>

        {/* Platform Selection */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 mb-2 text-sm text-zinc-300">
            <Sparkles className="w-5 h-5" /> Platform
          </label>
          <MediaTypeSelector
            selectedMediaType={targetPlatform}
            onMediaTypeChange={setTargetPlatform}
          />
        </div>

        {/* Transform Button */}
        <Button
          className="w-full bg-gradient-to-r from-green-500 to-emerald-500"
          disabled={!file || loading}
          onClick={handleTransform}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" /> Transforming...
            </>
          ) : (
            <>
              <Video className="w-4 h-4 mr-2" /> Transform for {targetPlatform}
            </>
          )}
        </Button>

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-500/10 rounded">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-300 flex-1">{error}</span>
            <Button variant="ghost" size="sm" onClick={clearError}>×</Button>
          </div>
        )}

        {/* Results Display */}
        {result && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white">
              <CheckCircle className="w-5 h-5 text-green-400" /> Complete
            </div>

            {result.clipFilenames && result.clipFilenames.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-white">
                        <Video className="w-4 h-4" /> Generated Clip
                    </div>
                    <video
                        className="w-full rounded-lg"
                        src={`${API_BASE_URL}/download-clip/${result.clipFilenames[0]}`}
                        controls
                        />
                </div>
            )}

            {/* {result.caption && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-white">
                    <FileText className="w-4 h-4" /> Caption
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => navigator.clipboard.writeText(result.caption)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <div className="p-3 bg-zinc-900/50 rounded">
                  <p className="text-sm text-zinc-300">{result.caption}</p>
                </div>
              </div>
            )} */}

            <div className="flex gap-2">
              <Button variant="outline" onClick={clearResult} className="flex-1">
                New Transform
              </Button>
              <Button onClick={handleDownload} disabled={!result.clipsCount}>
                <Download className="w-4 h-4 mr-2" />
                Download Clip
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Upload, 
  Video, 
  FileVideo, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Download,
  Play,
  FileText,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useVideoTransform, VideoTransformRequest } from "@/hooks/use-video-transform";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const MediaTransformPanel = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetPlatform, setTargetPlatform] = useState<'tiktok' | 'instagram' | 'twitter'>('tiktok');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { 
    loading, 
    error, 
    result, 
    transformVideo, 
    clearResult, 
    clearError 
  } = useVideoTransform();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file);
      clearResult();
      clearError();
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleTransform = async () => {
    if (!selectedFile) return;

    const request: VideoTransformRequest = {
      video: selectedFile,
      targetPlatform
    };

    await transformVideo(request);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'tiktok':
        return '🎵';
      case 'instagram':
        return '📸';
      case 'twitter':
        return '🐦';
      default:
        return '📱';
    }
  };

  const handleDownload = () => {
    if (!result || !result.clipFilenames || result.clipFilenames.length === 0) {
      console.warn("No clips to download.");
      return;
    }

    result.clipFilenames.forEach(filename => {
      const link = document.createElement('a');
      link.href = `${API_BASE_URL}/download-clip/${filename}`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  return (
    <Card className="h-full bg-black/40 backdrop-blur-xl border-zinc-800/50 shadow-2xl">
      <CardHeader className="border-b border-zinc-800/50 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
              <Video className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Media Transformer</h2>
              <p className="text-sm text-zinc-400">
                Upload videos and transform them for social media
              </p>
            </div>
          </div>
          
          {result && (
            <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30">
              {result.clipsCount} clips generated
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* File Upload Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FileVideo className="w-5 h-5 text-zinc-400" />
            <h3 className="text-md font-medium text-white">Upload Video</h3>
          </div>
          
          <div className="border-2 border-dashed border-zinc-700 rounded-lg p-6 text-center hover:border-zinc-600 transition-colors">
            {selectedFile ? (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <FileVideo className="w-8 h-8 text-green-400" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">{selectedFile.name}</p>
                    <p className="text-xs text-zinc-400">{formatFileSize(selectedFile.size)}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                  className="text-zinc-400 hover:text-white"
                >
                  Remove File
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload className="w-8 h-8 text-zinc-400 mx-auto" />
                <div>
                  <p className="text-sm text-white">Click to upload or drag and drop</p>
                  <p className="text-xs text-zinc-400">MP4, MOV, AVI up to 100MB</p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleFileUpload}
                  className="bg-zinc-800/50 border-zinc-700 text-zinc-300 hover:bg-zinc-700/50 hover:text-white"
                >
                  Choose File
                </Button>
              </div>
            )}
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {/* Platform Selection */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-zinc-400" />
            <h3 className="text-md font-medium text-white">Target Platform</h3>
          </div>
          
          <Select value={targetPlatform} onValueChange={(value: any) => setTargetPlatform(value)}>
            <SelectTrigger className="bg-zinc-900/50 border-zinc-700 text-white">
              <SelectValue placeholder="Select platform" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              <SelectItem value="tiktok" className="text-white hover:bg-zinc-800">
                <div className="flex items-center gap-2">
                  <span>🎵</span>
                  <span>TikTok</span>
                </div>
              </SelectItem>
              <SelectItem value="instagram" className="text-white hover:bg-zinc-800">
                <div className="flex items-center gap-2">
                  <span>📸</span>
                  <span>Instagram Reels</span>
                </div>
              </SelectItem>
              <SelectItem value="twitter" className="text-white hover:bg-zinc-800">
                <div className="flex items-center gap-2">
                  <span>🐦</span>
                  <span>Twitter/X</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Transform Button */}
        <Button
          onClick={handleTransform}
          disabled={!selectedFile || loading}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Transforming...
            </>
          ) : (
            <>
              <Video className="w-4 h-4 mr-2" />
              Transform for {targetPlatform.charAt(0).toUpperCase() + targetPlatform.slice(1)}
            </>
          )}
        </Button>

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-300 font-medium">Transformation Failed</p>
              <p className="text-xs text-red-400">{error}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearError}
              className="text-red-300 hover:text-red-100"
            >
              ×
            </Button>
          </div>
        )}

        {/* Results Display */}
        {result && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <h3 className="text-md font-medium text-white">Transformation Complete</h3>
            </div>
            
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-300">Platform:</span>
                <div className="flex items-center gap-2">
                  <span>{getPlatformIcon(result.platform)}</span>
                  <span className="text-sm text-white capitalize">{result.platform}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-300">Clips Generated:</span>
                <span className="text-sm text-white font-medium">{result.clipsCount}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-300">Transcript Length:</span>
                <span className="text-sm text-white">{result.transcript.length} characters</span>
              </div>
            </div>

            {/* Transcript Preview */}
            {result.transcript && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-zinc-400" />
                  <span className="text-sm font-medium text-white">Transcript Preview</span>
                </div>
                <ScrollArea className="h-32 bg-zinc-900/50 border border-zinc-700 rounded-lg p-3">
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {result.transcript.length > 300 
                      ? `${result.transcript.substring(0, 300)}...` 
                      : result.transcript
                    }
                  </p>
                </ScrollArea>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearResult}
                className="flex-1 bg-zinc-800/50 border-zinc-700 text-zinc-300 hover:bg-zinc-700/50 hover:text-white"
              >
                Transform Another
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={!result || result.clipsCount === 0}
                className="bg-blue-500/20 border-blue-500/30 text-blue-300 hover:bg-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Clips
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 
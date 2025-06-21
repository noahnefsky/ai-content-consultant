
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Send, Upload, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatPanelProps {
  chatInput: string;
  setChatInput: (value: string) => void;
  selectedPlatforms: string[];
}

export const ChatPanel = ({ chatInput, setChatInput, selectedPlatforms }: ChatPanelProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState<Array<{ type: 'user' | 'assistant', content: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    
    const newMessages = [
      ...messages,
      { type: 'user' as const, content: chatInput },
      { 
        type: 'assistant' as const, 
        content: `Great idea! Based on current viral trends${selectedPlatforms.length > 0 ? ` for ${selectedPlatforms.join(', ')}` : ''}, I can help you create content that's likely to go viral. Let me analyze similar trending posts and suggest hashtags and captions.` 
      }
    ];
    
    setMessages(newMessages);
    setChatInput("");
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // Voice recording logic would go here
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="h-full bg-black/40 backdrop-blur-xl border-zinc-800/50 shadow-2xl">
      <CardHeader className="border-b border-zinc-800/50 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-violet-500 to-purple-500 rounded-lg">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">AI Content Assistant</h2>
            <p className="text-sm text-zinc-400">Tell us your idea or upload a video</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex flex-col h-[calc(100%-100px)]">
        {/* Messages */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="p-4 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-2xl mb-6 border border-violet-500/30">
                <Mic className="w-8 h-8 text-violet-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Ready to go viral?</h3>
              <p className="text-sm text-zinc-400 max-w-sm">Share your content idea or upload a video to get personalized suggestions for captions and hashtags.</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex gap-3 max-w-[85%]",
                  message.type === 'user' ? "ml-auto flex-row-reverse" : ""
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                  message.type === 'user' 
                    ? "bg-gradient-to-r from-blue-500 to-cyan-500" 
                    : "bg-gradient-to-r from-violet-500 to-purple-500"
                )}>
                  {message.type === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className={cn(
                  "rounded-2xl px-4 py-3 shadow-lg",
                  message.type === 'user'
                    ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                    : "bg-zinc-800/50 text-zinc-100 border border-zinc-700/30"
                )}>
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 border-t border-zinc-800/50 space-y-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleFileUpload}
              className="bg-zinc-800/50 border-zinc-700 text-zinc-300 hover:bg-zinc-700/50 hover:text-white"
            >
              <Upload className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleRecording}
              className={cn(
                "bg-zinc-800/50 border-zinc-700 text-zinc-300 hover:bg-zinc-700/50 hover:text-white",
                isRecording && "bg-red-500/20 border-red-500/50 text-red-400"
              )}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            {selectedPlatforms.length > 0 && (
              <Badge variant="secondary" className="bg-zinc-800/50 text-zinc-300 border-zinc-700">
                {selectedPlatforms.length} platform{selectedPlatforms.length > 1 ? 's' : ''} selected
              </Badge>
            )}
          </div>
          
          <div className="flex gap-3">
            <Textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Describe your content idea..."
              className="bg-zinc-900/50 border-zinc-700 text-white placeholder:text-zinc-500 resize-none focus:border-violet-500/50 focus:ring-violet-500/20"
              rows={2}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!chatInput.trim()}
              className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white shadow-lg"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              console.log("File uploaded:", e.target.files?.[0]);
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

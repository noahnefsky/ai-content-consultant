import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Send, Upload, Bot, User, Search, Loader2, Sparkles, Video, MessageSquare, Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import { Video as VideoType, ContentType } from "@/hooks/use-videos";
import { useAIService } from "@/hooks/use-ai-service";
import { ContentGenerationRequest, ContentIdea } from "../../../services/ai-content-service";

interface ChatPanelProps {
  chatInput: string;
  setChatInput: (value: string) => void;
  selectedPlatforms: ContentType[];
  onSearch: (searchTerm: string, contentTypes?: ContentType[]) => Promise<void>;
  videos: VideoType[];
}

export const ChatPanel = ({ 
  chatInput, 
  setChatInput, 
  selectedPlatforms, 
  onSearch,
  videos
}: ChatPanelProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState<Array<{ 
    type: 'user' | 'assistant', 
    content: string,
    timestamp: Date,
    generatedContent?: ContentIdea
  }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use the unified AI service
  const { generateCustomContent, aiLoading, aiError } = useAIService();

  const handleSendMessage = async () => {
    console.log('ChatPanel: handleSendMessage called with chatInput:', chatInput);
    if (!chatInput.trim()) return;
    
    const userMessage = { 
      type: 'user' as const, 
      content: chatInput,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setChatInput("");

    // Check if the message looks like a search query - make it more specific
    const searchKeywords = ['find', 'search', 'trending', 'popular'];
    const searchPhrases = ['find videos', 'search for', 'trending videos', 'popular videos'];
    
    const hasSearchKeyword = searchKeywords.some(keyword => 
      chatInput.toLowerCase().includes(keyword)
    );
    
    const hasSearchPhrase = searchPhrases.some(phrase => 
      chatInput.toLowerCase().includes(phrase)
    );
    
    // Only treat as search if it has explicit search phrases, not just keywords
    const isSearchQuery = hasSearchPhrase || 
      (hasSearchKeyword && chatInput.toLowerCase().includes('videos'));

    console.log('ChatPanel: isSearchQuery:', isSearchQuery);

    if (isSearchQuery) {
      // Extract search term (remove search keywords)
      const searchTerm = chatInput
        .toLowerCase()
        .replace(/\b(find|search|trending|viral|popular)\b/g, '')
        .replace(/\bvideos?\b/g, '')
        .trim();
      
      if (searchTerm) {
        await onSearch(searchTerm);
        setMessages(prev => [...prev, {
          type: 'assistant',
          content: `Searching for "${searchTerm}"... I found ${videos.length} trending videos that match your query.`,
          timestamp: new Date()
        }]);
      }
    } else {
      console.log('ChatPanel: Generating AI content for non-search query');
      // ALWAYS generate AI content for every chat message
      // Get relevant video transcripts for context
      const relevantVideos = videos.filter(video => 
        selectedPlatforms.length === 0 || selectedPlatforms.includes(video.content_type)
      );
      
      console.log('ChatPanel: relevantVideos:', relevantVideos.length);
      
      // Extract transcripts from relevant videos
      const transcripts = relevantVideos.flatMap(video => [
        video.title,
        video.description
      ]).filter(text => text && text.trim().length > 0);
      
      console.log('ChatPanel: transcripts:', transcripts);
      
      // Create AI generation request
      const request: ContentGenerationRequest = {
        userPrompt: chatInput,
        systemPrompt: `You are an expert content strategist and social media consultant. 
        The user is asking for help with content creation, strategy, or advice.
        Provide helpful, actionable responses that are engaging and informative.
        If they're asking for content ideas, provide structured content suggestions.
        If they're asking for advice, give practical tips and strategies.
        Always be encouraging and supportive while being realistic about what works on social media.`,
        transcripts: transcripts,
        platform: selectedPlatforms.length > 0 ? 
          (selectedPlatforms[0] as any) : 'tiktok'
      };

      console.log('ChatPanel: AI request created:', request);

      // Generate AI response
      const generatedContent = await generateCustomContent(request);
      console.log('ChatPanel: Generated content received:', generatedContent);
      
      if (generatedContent) {
        // Check if this is a conversational response
        const isConversational = generatedContent.hashtags.length === 0 && 
          generatedContent.caption === 'This is a conversational response - no specific caption needed.';
        
        setMessages(prev => [...prev, {
          type: 'assistant',
          content: isConversational ? 
            `Here's my response:` : 
            `Here's your AI-generated content idea:`,
          timestamp: new Date(),
          generatedContent
        }]);
      } else {
        setMessages(prev => [...prev, {
          type: 'assistant',
          content: `I'm having trouble generating a response right now. Please try again or check your API key.`,
          timestamp: new Date()
        }]);
      }
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // Voice recording logic would go here
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderGeneratedContent = (content: ContentIdea) => {
    // Check if this is a conversational response (no hashtags and generic caption)
    const isConversational = content.hashtags.length === 0 && 
      content.caption === 'This is a conversational response - no specific caption needed.';
    
    if (isConversational) {
      // For conversational responses, show the content in a simple format
      return (
        <div className="mt-3">
          <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-3">
            <p className="text-sm text-white/90 whitespace-pre-wrap">{content.videoStructure}</p>
          </div>
        </div>
      );
    }
    
    // For structured content, show all sections
    return (
      <div className="mt-3 space-y-3">
        {/* Idea */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-300">IDEA</span>
          </div>
          <p className="text-sm text-white/90">{content.idea}</p>
        </div>

        {/* Video Structure */}
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Video className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-300">VIDEO STRUCTURE</span>
          </div>
          <p className="text-sm text-white/90 whitespace-pre-wrap">{content.videoStructure}</p>
        </div>

        {/* Caption */}
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="h-4 w-4 text-green-400" />
            <span className="text-sm font-medium text-green-300">CAPTION</span>
          </div>
          <p className="text-sm text-white/90">{content.caption}</p>
        </div>

        {/* Hashtags */}
        {content.hashtags.length > 0 && (
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Hash className="h-4 w-4 text-orange-400" />
              <span className="text-sm font-medium text-orange-300">HASHTAGS</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {content.hashtags.map((hashtag, index) => (
                <Badge key={index} variant="secondary" className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                  #{hashtag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    );
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
            <p className="text-sm text-zinc-400">
              {videos.length > 0 ? `${videos.length} videos found` : 'Tell us your idea or upload a video'}
            </p>
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
              <p className="text-sm text-zinc-400 max-w-sm">
                Share your content idea, search for trending videos, or say "generate content" to create AI-powered posts.
              </p>
              {videos.length > 0 && (
                <div className="mt-4 p-3 bg-white/5 rounded-lg">
                  <p className="text-sm text-white/70 mb-2">Recent search results:</p>
                  <div className="text-xs text-white/50">
                    {videos.slice(0, 3).map(video => (
                      <div key={video.id} className="mb-1">
                        • {video.title} ({video.content_type})
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                  
                  {/* Render generated content if available */}
                  {message.generatedContent && renderGeneratedContent(message.generatedContent)}
                  
                  <div className="text-xs opacity-60 mt-1">
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            ))
          )}

          {/* AI Loading Indicator */}
          {aiLoading && (
            <div className="flex items-center gap-3 max-w-[85%]">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-r from-violet-500 to-purple-500">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="rounded-2xl px-4 py-3 shadow-lg bg-zinc-800/50 text-zinc-100 border border-zinc-700/30">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                  <span className="text-sm">Generating AI content...</span>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {aiError && (
            <div className="flex items-center gap-3 max-w-[85%]">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-r from-red-500 to-pink-500">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="rounded-2xl px-4 py-3 shadow-lg bg-red-500/10 text-red-100 border border-red-500/30">
                <p className="text-sm">Error: {aiError}</p>
              </div>
            </div>
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
              placeholder="Describe your content idea, search for trends, or say 'generate content'..."
              className="bg-zinc-900/50 border-zinc-700 text-white placeholder:text-zinc-500 resize-none focus:border-violet-500/50 focus:ring-violet-500/20"
              rows={2}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!chatInput.trim() || aiLoading}
              className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white shadow-lg"
            >
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
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

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, Upload, Bot, User, Loader2, Sparkles, Video, MessageSquare, Hash, Trash2, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Video as VideoType, ContentType } from "@/hooks/use-videos";
import { useConversationService, ConversationMessage, ContentIdea } from "@/hooks/use-conversation-service";
import { MediaType, MediaTypeSelector } from "./MediaTypeSelector";

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
  const [copiedSections, setCopiedSections] = useState<Record<string, boolean>>({});
  const [selectedMediaType, setSelectedMediaType] = useState<MediaType>('tiktok');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use the new conversation service with state graph
  const { 
    messages, 
    loading, 
    error, 
    conversationContext,
    sendMessage, 
    clearConversation, 
    clearError 
  } = useConversationService();

  const handleSendMessage = async () => {
    console.log('ChatPanel: handleSendMessage called with chatInput:', chatInput);
    if (!chatInput.trim()) return;
    
    // Check if the message looks like a search query
    const searchKeywords = ['find', 'search', 'trending', 'popular'];
    const searchPhrases = ['find videos', 'search for', 'trending videos', 'popular videos'];
    
    const hasSearchKeyword = searchKeywords.some(keyword => 
      chatInput.toLowerCase().includes(keyword)
    );
    
    const hasSearchPhrase = searchPhrases.some(phrase => 
      chatInput.toLowerCase().includes(phrase)
    );
    
    const isSearchQuery = hasSearchPhrase || 
      (hasSearchKeyword && chatInput.toLowerCase().includes('videos'));

    console.log('ChatPanel: isSearchQuery:', isSearchQuery);

    if (isSearchQuery) {
      // Handle search queries
      const searchTerm = chatInput
        .toLowerCase()
        .replace(/\b(find|search|trending|viral|popular)\b/g, '')
        .replace(/\bvideos?\b/g, '')
        .trim();
      
      if (searchTerm) {
        await onSearch(searchTerm);
        // Add search result message to conversation
        await sendMessage(`I searched for "${searchTerm}" and found ${videos.length} trending videos.`);
      }
    } else {
      // Use the conversation service for all other messages
      // Pass the selected platforms and trending content to tailor the response
      const platformNames = selectedPlatforms.map(platform => platform.toLowerCase());
      await sendMessage(chatInput, platformNames, videos, selectedMediaType);
    }
    
    setChatInput("");
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const copyToClipboard = async (text: string, sectionId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSections(prev => ({ ...prev, [sectionId]: true }));
      setTimeout(() => {
        setCopiedSections(prev => ({ ...prev, [sectionId]: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const cleanHashtags = (hashtags: string[]): string[] => {
    return hashtags
      .filter(tag => tag && tag.trim().length > 0)
      .map(tag => tag.replace(/^#+/, '').trim())
      .filter(tag => tag.length > 0 && !tag.includes('{') && !tag.includes('}') && !tag.includes('`'));
  };

  const renderGeneratedContent = (content: ContentIdea) => {
    console.log('ChatPanel: renderGeneratedContent called with:', content);
    
    // Check if this is a conversational response
    const isConversational = (!content.hashtags || content.hashtags.length === 0) && 
      (!content.caption || content.caption === 'This is a conversational response - no specific caption needed.');
    
    // Check if the content has meaningful structured data
    const hasStructuredData = content.idea && content.idea !== 'No idea generated' &&
      content.videoStructure && content.videoStructure !== 'No structure provided' &&
      content.caption && content.caption !== 'No caption generated';

    // Add safety checks for string splitting
    if (content.idea && typeof content.idea === 'string' && content.idea.includes('"')) {
      const ideaParts = content.idea.split('"');
      content.idea = ideaParts.length > 1 ? ideaParts[1] : content.idea;
    }
    
    if (content.videoStructure && typeof content.videoStructure === 'string' && content.videoStructure.includes('"')) {
      const structureParts = content.videoStructure.split('"');
      content.videoStructure = structureParts.length > 1 ? structureParts[1] : content.videoStructure;
    }
    
    if (content.caption && typeof content.caption === 'string' && content.caption.includes('"')) {
      const captionParts = content.caption.split('"');
      content.caption = captionParts.length > 1 ? captionParts[1] : content.caption;
    }
        
    if (isConversational || !hasStructuredData) {
      // For conversational responses, show the content in a simple format
      const displayText = content.videoStructure.split('"')[1] || content.idea.split('"')[1] || content.caption.split('"')[1] || '';
      if (!displayText) return null;
      
      return (
        <div className="mt-4">
          <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-lg p-4">
            <p className="text-sm text-white/90 whitespace-pre-wrap leading-relaxed">{displayText}</p>
          </div>
        </div>
      );
    }
    
    // Clean hashtags before displaying
    const cleanedHashtags = cleanHashtags(content.hashtags || []);
    
    // For structured content, show ONLY the cards without any initial text
    return (
      <div className="mt-4 space-y-4">
        {/* Idea Section */}
        {content.idea && content.idea !== 'No idea generated' && (
          <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg p-4 group">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-500/20 rounded-md">
                  <Sparkles className="h-4 w-4 text-blue-400" />
                </div>
                <span className="text-sm font-semibold text-blue-300 uppercase tracking-wide">Content Idea</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(content.idea, 'idea')}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-400 hover:text-blue-300"
              >
                {copiedSections.idea ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-sm text-white/90 leading-relaxed">{content.idea}</p>
          </div>
        )}

        {/* Video Structure Section */}
        {content.videoStructure && !content.videoStructure.includes("null") && content.videoStructure !== 'No structure provided' && (
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-4 group">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-500/20 rounded-md">
                  <Video className="h-4 w-4 text-purple-400" />
                </div>
                <span className="text-sm font-semibold text-purple-300 uppercase tracking-wide">Video Structure</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(content.videoStructure, 'structure')}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-purple-400 hover:text-purple-300"
              >
                {copiedSections.structure ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="text-sm text-white/90 leading-relaxed">
              <p className="whitespace-pre-wrap">{content.videoStructure}</p>
            </div>
          </div>
        )}

        {/* Caption Section */}
        {content.caption && content.caption !== 'No caption generated' && (
          <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-4 group">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-green-500/20 rounded-md">
                  <MessageSquare className="h-4 w-4 text-green-400" />
                </div>
                <span className="text-sm font-semibold text-green-300 uppercase tracking-wide">Caption</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(content.caption, 'caption')}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-green-400 hover:text-green-300"
              >
                {copiedSections.caption ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-sm text-white/90 leading-relaxed">{content.caption}</p>
          </div>
        )}


      </div>
    );
  };

  return (
    <Card className="h-full bg-black/40 backdrop-blur-xl border-zinc-800/50 shadow-2xl">
      <CardHeader className="border-b border-zinc-800/50 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-violet-500 to-purple-500 rounded-lg">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">AI Content Assistant</h2>
              <p className="text-sm text-zinc-400">
                {messages.length > 0 ? `${messages.length} messages` : 'Tell us your idea or upload a video'}
              </p>
            </div>
          </div>
          
          {/* Conversation Context Badge */}
          {conversationContext.current_intent && (
            <Badge variant="secondary" className="bg-violet-500/20 text-violet-300 border-violet-500/30">
              {conversationContext.current_intent.replace('_', ' ')}
            </Badge>
          )}
          
          {/* Clear Conversation Button */}
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearConversation}
              className="text-zinc-400 hover:text-white hover:bg-zinc-800/50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0 flex flex-col h-[calc(100%-100px)]">
        {/* Messages */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="p-4 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-2xl mb-6 border border-violet-500/30">
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Ready to go viral?</h3>
              <p className="text-sm text-zinc-400 max-w-sm">
                Share your content idea, search for trending videos, or ask for advice. I'll remember our conversation and provide contextual responses.
              </p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex gap-3 max-w-[90%]",
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
                  "rounded-2xl px-4 py-3 shadow-lg flex-1",
                  message.type === 'user'
                    ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                    : "bg-zinc-800/50 text-zinc-100 border border-zinc-700/30"
                )}>
                  {/* Only show message content if there's no structured content, or if it's a user message */}
                  {(message.type === 'user' || !message.structuredContent) && (
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  )}
                  
                  {/* Render generated content if available */}
                  {message.structuredContent && (() => {
                    console.log('ChatPanel: Rendering structured content for message:', message.structuredContent);
                    return renderGeneratedContent(message.structuredContent);
                  })()}
                  
                  <div className="text-xs opacity-60 mt-2">
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            ))
          )}

          {/* AI Loading Indicator */}
          {loading && (
            <div className="flex items-center gap-3 max-w-[90%]">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-r from-violet-500 to-purple-500">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="rounded-2xl px-4 py-3 shadow-lg bg-zinc-800/50 text-zinc-100 border border-zinc-700/30">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                  <span className="text-sm">Processing your message...</span>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-3 max-w-[90%]">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-r from-red-500 to-pink-500">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="rounded-2xl px-4 py-3 shadow-lg bg-red-500/10 text-red-100 border border-red-500/30">
                <div className="flex items-center justify-between">
                  <p className="text-sm">Error: {error}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearError}
                    className="text-red-300 hover:text-red-100"
                  >
                    ×
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 border-t border-zinc-800/50 space-y-4">
          <MediaTypeSelector 
            selectedMediaType={selectedMediaType}
            onMediaTypeChange={setSelectedMediaType}
          />
          <div className="flex gap-2">
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
              placeholder="Describe your content idea, search for trends, or ask for advice..."
              className="bg-zinc-900/50 border-zinc-700 text-white placeholder:text-zinc-500 resize-none focus:border-violet-500/50 focus:ring-violet-500/20"
              rows={2}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!chatInput.trim() || loading}
              className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white shadow-lg"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
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
import { GoogleGenerativeAI } from '@google/generative-ai';

// Types for the content generation request
export interface ContentGenerationRequest {
  userPrompt: string;
  systemPrompt?: string;
  transcripts: string[];
  platform?: 'tiktok' | 'instagram' | 'youtube' | 'twitter';
}

// Types for the structured response
export interface ContentIdea {
  idea: string;
  videoStructure: string;
  caption: string;
  hashtags: string[];
}

export interface ContentGenerationResponse {
  success: boolean;
  content?: ContentIdea;
  error?: string;
}

// Default system prompt for content generation
const DEFAULT_SYSTEM_PROMPT = `You are an expert content strategist and social media consultant specializing in viral content creation. 
You help users with content ideas, strategy advice, and social media best practices.

When responding to users:
- Be conversational, helpful, and encouraging
- Provide actionable advice and practical tips
- If they ask for content ideas, structure your response with IDEA, VIDEO STRUCTURE, CAPTION, and HASHTAGS
- If they ask for general advice, provide helpful insights without forcing the structured format
- Use the provided viral transcripts as context and inspiration
- Be realistic about what works on social media while being supportive

For content generation requests, structure your response with:
1. IDEA: A clear, compelling concept that can go viral
2. VIDEO STRUCTURE: Overall structure and flow of the video (not step-by-step instructions)
3. CAPTION: Engaging caption that complements the video
4. HASHTAGS: Relevant, trending hashtags for maximum reach

For general questions and advice, respond naturally and conversationally.

IMPORTANT: For VIDEO STRUCTURE, provide the overall concept and flow, not detailed step-by-step filming instructions. Focus on the narrative arc, key moments, and overall structure that will engage viewers.`;

export class AIContentService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private useMock: boolean = false;

  constructor() {
    const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;
    
    console.log('AIContentService: Initializing with API key:', apiKey ? 'Present' : 'Missing');
    
    if (!apiKey || apiKey === 'YOUR_API_KEY' || apiKey === 'your_google_ai_api_key_here') {
      console.warn('AIContentService: No valid API key found, using mock service');
      this.useMock = true;
      return;
    }
    
    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      console.log('AIContentService: Successfully initialized with Google AI');
    } catch (error) {
      console.error('AIContentService: Failed to initialize Google AI:', error);
      this.useMock = true;
    }
  }

  /**
   * Generate content ideas based on viral transcripts and user input
   */
  async generateContentIdea(request: ContentGenerationRequest): Promise<ContentGenerationResponse> {
    console.log('AIContentService: generateContentIdea called with:', request);
    
    if (this.useMock) {
      console.log('AIContentService: Using mock service');
      return this.generateMockContent(request);
    }
    
    try {
      const systemPrompt = request.systemPrompt || DEFAULT_SYSTEM_PROMPT;
      
      // Build the prompt with context
      const fullPrompt = this.buildPrompt(request, systemPrompt);
      console.log("AIContentService: Full prompt:", fullPrompt);
      
      // Generate content
      const result = await this.model.generateContent(fullPrompt);
      console.log("AIContentService: Raw result:", result);
      const response = await result.response;
      const text = response.text();
      console.log("AIContentService: Generated text:", text);
      
      // Parse the structured response
      const content = this.parseStructuredResponse(text);
      
      return {
        success: true,
        content
      };
    } catch (error) {
      console.error('AIContentService: Error generating content:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Generate mock content for testing
   */
  private generateMockContent(request: ContentGenerationRequest): ContentGenerationResponse {
    console.log('AIContentService: Generating mock content');
    
    // Check if this is a conversational request
    const isConversational = !request.userPrompt.toLowerCase().includes('generate') && 
                            !request.userPrompt.toLowerCase().includes('content') &&
                            !request.userPrompt.toLowerCase().includes('idea');
    
    if (isConversational) {
      return {
        success: true,
        content: {
          idea: "Here's my advice on that topic:",
          videoStructure: `Based on your question about "${request.userPrompt}", here's what I recommend:

1. Start by understanding your audience and what they care about
2. Focus on providing genuine value rather than just trying to go viral
3. Be consistent with your content schedule
4. Engage with your audience in the comments
5. Study what's working in your niche and adapt those strategies

Remember, authentic content that helps people will always perform better than trying to chase trends.`,
          caption: 'This is a conversational response - no specific caption needed.',
          hashtags: []
        }
      };
    }
    
    return {
      success: true,
      content: {
        idea: `Viral ${request.platform || 'social media'} content idea based on "${request.userPrompt}"`,
        videoStructure: `This video follows a compelling narrative arc that hooks viewers from the start and keeps them engaged throughout. The structure builds from an attention-grabbing opening that immediately addresses the viewer's pain point, transitions into presenting the problem in a relatable way, then delivers the solution with clear value. The video concludes with a strong call-to-action that encourages engagement and follows. The overall flow is designed to maximize watch time and sharing potential.`,
        caption: `🔥 ${request.userPrompt} - This changed everything for me! 

What's your biggest challenge with this? Drop a ❤️ if you agree!

#${request.platform || 'viral'} #content #trending #socialmedia`,
        hashtags: [request.platform || 'viral', 'content', 'trending', 'socialmedia', 'tips']
      }
    };
  }

  /**
   * Build the complete prompt with all context
   */
  private buildPrompt(request: ContentGenerationRequest, systemPrompt: string): string {
    const platformContext = request.platform ? 
      `\nPlatform: ${request.platform.toUpperCase()}` : 
      '\nPlatform: General (works across all platforms)';
    
    const transcriptsContext = request.transcripts.length > 0 ?
      `\n\nVIRAL TRANSCRIPTS TO ANALYZE:\n${request.transcripts.map((t, i) => `${i + 1}. ${t}`).join('\n')}` :
      '\n\nNo specific transcripts provided - focus on general viral content principles.';
    
    return `${systemPrompt}

${platformContext}

USER'S CONTENT IDEA: ${request.userPrompt}

${transcriptsContext}

Please provide your response in the following structured format:

IDEA: [Your viral content idea here]

VIDEO STRUCTURE: [Overall structure and flow of the video]

CAPTION: [Engaging caption that will drive engagement]

HASHTAGS: [List of relevant hashtags separated by spaces]`;
  }

  /**
   * Parse the AI response into structured content
   */
  private parseStructuredResponse(text: string): ContentIdea {
    // Check if the response contains structured content (IDEA, VIDEO STRUCTURE, etc.)
    const hasStructuredContent = /IDEA:|VIDEO STRUCTURE:|CAPTION:|HASHTAGS:/i.test(text);
    
    if (hasStructuredContent) {
      // Extract sections using regex for structured content
      const ideaMatch = text.match(/IDEA:\s*(.+?)(?=\n\n|\nVIDEO STRUCTURE:|$)/s);
      const structureMatch = text.match(/VIDEO STRUCTURE:\s*(.+?)(?=\n\n|\nCAPTION:|$)/s);
      const captionMatch = text.match(/CAPTION:\s*(.+?)(?=\n\n|\nHASHTAGS:|$)/s);
      const hashtagsMatch = text.match(/HASHTAGS:\s*(.+?)(?=\n\n|$)/s);

      const idea = ideaMatch ? ideaMatch[1].trim() : 'No idea generated';
      const videoStructure = structureMatch ? structureMatch[1].trim() : 'No structure provided';
      const caption = captionMatch ? captionMatch[1].trim() : 'No caption generated';
      
      // Parse hashtags
      let hashtags: string[] = [];
      if (hashtagsMatch) {
        hashtags = hashtagsMatch[1]
          .trim()
          .split(/\s+/)
          .filter(tag => tag.startsWith('#'))
          .map(tag => tag.replace('#', '').toLowerCase());
      }

      return {
        idea,
        videoStructure,
        caption,
        hashtags
      };
    } else {
      // Handle conversational responses - treat the entire response as the idea
      const lines = text.split('\n').filter(line => line.trim().length > 0);
      const idea = lines.length > 0 ? lines[0] : 'No response generated';
      const videoStructure = lines.length > 1 ? lines.slice(1).join('\n') : 'No additional details provided';
      
      return {
        idea,
        videoStructure,
        caption: 'This is a conversational response - no specific caption needed.',
        hashtags: []
      };
    }
  }

  /**
   * Test the service connection
   */
  async testConnection(): Promise<boolean> {
    if (this.useMock) {
      console.log('AIContentService: Mock service - connection test passed');
      return true;
    }
    
    try {
      const result = await this.model.generateContent('Hello, this is a test.');
      await result.response;
      console.log('AIContentService: Real service - connection test passed');
      return true;
    } catch (error) {
      console.error('AIContentService: Connection test failed:', error);
      return false;
    }
  }
}

// Export a factory function for easy instantiation
export function createAIContentService(): AIContentService {
  return new AIContentService();
} 
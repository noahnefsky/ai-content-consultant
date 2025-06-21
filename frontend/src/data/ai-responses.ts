import { AIResponse } from '@/hooks/use-ai-service';

export const mockAIResponses: AIResponse[] = [
  {
    id: 'ai-response-1',
    content: '🔥 MORNING ROUTINE HACKS THAT ACTUALLY WORK! 🌅\n\nHey everyone! I\'ve been testing these morning routine hacks for the past month and they\'ve completely transformed my productivity. Here\'s what you need to know:\n\n✅ Prep your clothes the night before (saves 10 minutes)\n✅ Use the 5-minute rule for small tasks\n✅ Start with a glass of water (hydration is key!)\n✅ Create a "power hour" for your most important work\n\nThese simple changes have helped me go from hitting snooze 5 times to being fully productive by 8 AM! 💪\n\n#MorningRoutine #ProductivityHacks #LifeHacks #MorningMotivation #SelfImprovement #RoutineGoals #ProductivityTips #MorningHabits #LifeOptimization #GetItDone',
    content_type: 'tiktok',
    generated_at: '2024-01-15T09:30:00Z',
    relevant_media: 'Good morning everyone! Today I\'m sharing my favorite morning routine hacks that literally changed my life. First, I prep my clothes the night before. Second, I use the 5-minute rule for tasks. Third, I always start with a glass of water. These small changes made such a huge difference in my daily routine.'
  },
  {
    id: 'ai-response-2',
    content: '🌅 Golden Hour Photography Masterclass 📸\n\nCapturing the perfect sunset shot isn\'t just about timing - it\'s about technique! Here\'s my complete guide to golden hour photography:\n\n📱 Camera Settings:\n• Aperture: f/8-f/11 for sharp landscapes\n• ISO: 100-400 for clean shots\n• Shutter Speed: 1/60-1/125 for handheld\n\n🎯 Composition Tips:\n• Use the rule of thirds\n• Include foreground elements\n• Look for natural frames\n• Experiment with silhouettes\n\n✨ Pro Tip: Arrive 30 minutes before sunset to scout your location and set up your shot!\n\n#GoldenHour #PhotographyTips #SunsetPhotography #PhotographyGuide #LandscapePhotography #PhotographySkills #CameraTips #PhotographyHacks #SunsetLovers #PhotographyCommunity',
    content_type: 'instagram',
    generated_at: '2024-01-15T19:15:00Z',
    relevant_media: 'Capture the perfect golden hour shot with these photography techniques!'
  },
  {
    id: 'ai-response-3',
    content: '🚀 The Future of AI in the Workplace: What You Need to Know\n\nAI isn\'t taking our jobs - it\'s changing them. Here\'s what I\'ve learned from working with AI tools for the past year:\n\n1️⃣ AI is a productivity multiplier, not a replacement\n2️⃣ The key skill is prompt engineering\n3️⃣ Human creativity and empathy remain irreplaceable\n4️⃣ Continuous learning is more important than ever\n5️⃣ Collaboration between humans and AI creates the best results\n\n💡 Key Takeaway: Focus on developing skills that complement AI rather than compete with it.\n\n#AI #FutureOfWork #Technology #Innovation #DigitalTransformation #AIProductivity #WorkplaceTech #CareerDevelopment #TechTrends #ArtificialIntelligence',
    content_type: 'twitter',
    generated_at: '2024-01-15T11:45:00Z',
    relevant_media: 'AI isn\'t taking our jobs - it\'s changing them. The key is adaptation. Here\'s what I\'ve learned from working with AI tools for the past year: 1/5'
  },
  {
    id: 'ai-response-4',
    content: '🎯 Leadership in the Digital Age: Building High-Performing Remote Teams\n\nAs we navigate the future of work, effective leadership has never been more critical. Here are the key principles I\'ve learned leading remote teams:\n\n🔑 Trust-Based Leadership\n• Focus on outcomes, not hours\n• Provide autonomy with clear expectations\n• Regular check-ins, not micromanagement\n\n📱 Digital Communication Excellence\n• Over-communicate important information\n• Use video calls for complex discussions\n• Create clear documentation and processes\n\n🌟 Building Culture Remotely\n• Virtual team building activities\n• Recognition and celebration\n• Shared values and mission alignment\n\n💡 The most successful remote leaders understand that technology enables human connection, not replaces it.\n\nWhat leadership challenges are you facing in the digital workplace?\n\n#Leadership #RemoteWork #DigitalTransformation #TeamManagement #WorkplaceCulture #LeadershipDevelopment #RemoteLeadership #FutureOfWork #TeamBuilding #DigitalLeadership',
    content_type: 'linkedin',
    generated_at: '2024-01-15T08:45:00Z',
    relevant_media: 'How to lead effectively in a remote-first world'
  }
];

// Function to get AI response based on content type and search term
export const getAIResponseForContent = (contentType: string, searchTerm?: string): AIResponse => {
  // Find a response that matches the content type
  const matchingResponse = mockAIResponses.find(response => response.content_type === contentType);
  
  if (matchingResponse) {
    // If there's a search term, customize the response
    if (searchTerm) {
      return {
        ...matchingResponse,
        id: `ai-response-${Date.now()}`,
        content: `🎯 ${searchTerm.toUpperCase()} - CONTENT IDEA!\n\n${matchingResponse.content}\n\nThis content is specifically tailored for ${searchTerm} and will help you create engaging ${contentType} content that resonates with your audience!`,
        generated_at: new Date().toISOString()
      };
    }
    
    return {
      ...matchingResponse,
      id: `ai-response-${Date.now()}`,
      generated_at: new Date().toISOString()
    };
  }
  
  // Fallback response if no matching content type
  return {
    id: `ai-response-${Date.now()}`,
    content: `✨ AMAZING ${contentType.toUpperCase()} CONTENT IDEA!\n\nHere\'s a viral-worthy post for ${contentType}:\n\n🔥 The Ultimate Guide to [Your Topic]\n\nI\'ve spent months researching and testing this, and the results are incredible! Here\'s what you need to know:\n\n✅ Step 1: [Key Point]\n✅ Step 2: [Key Point]\n✅ Step 3: [Key Point]\n\n💡 Pro Tip: [Insider Knowledge]\n\nThis approach has helped me [achieve specific result] and I know it will work for you too!\n\n#${contentType.charAt(0).toUpperCase() + contentType.slice(1)} #ContentCreation #ViralContent #SocialMediaTips #ContentStrategy #DigitalMarketing #SocialMediaMarketing #ContentCreator #ViralPost #Trending`,
    content_type: contentType as any,
    generated_at: new Date().toISOString(),
    relevant_media: searchTerm || 'General content idea'
  };
}; 
import { Video, ContentType } from '@/hooks/use-videos';

export const mockVideos: Video[] = [
  // TikTok Videos
  {
    id: 'tiktok-1',
    title: 'Quick Morning Routine Hacks',
    description: 'Transform your morning with these 5-minute life hacks that will save you time and boost your productivity!',
    content_type: 'tiktok',
    url: 'https://tiktok.com/@creator1/video/123456',
    transcript: 'Good morning everyone! Today I\'m sharing my favorite morning routine hacks that literally changed my life. First, I prep my clothes the night before. Second, I use the 5-minute rule for tasks. Third, I always start with a glass of water. These small changes made such a huge difference in my daily routine.',
    created_at: '2024-01-15T08:30:00Z',
    views: 2500000,
    likes: 180000,
    shares: 45000
  },
  {
    id: 'tiktok-2',
    title: 'Cooking Hack: Perfect Rice Every Time',
    description: 'The secret to fluffy rice that restaurant chefs don\'t want you to know!',
    content_type: 'tiktok',
    url: 'https://tiktok.com/@chefpro/video/789012',
    transcript: 'Hey foodies! Here\'s the rice cooking hack that changed everything for me. Instead of measuring water, use the finger method. Add rice to pot, add water until it reaches your first knuckle when you touch the rice. Cook on low heat, never stir, and let it rest for 10 minutes. Perfect rice every single time!',
    created_at: '2024-01-14T12:15:00Z',
    views: 1800000,
    likes: 120000,
    shares: 28000
  },
  {
    id: 'tiktok-3',
    title: 'Workout Motivation: 30-Day Challenge',
    description: 'Join thousands in this 30-day fitness challenge that actually works!',
    content_type: 'tiktok',
    url: 'https://tiktok.com/@fitnessguru/video/345678',
    transcript: 'Starting a 30-day fitness challenge today! Here\'s what we\'re doing: 20 push-ups, 30 squats, 1-minute plank, and 50 jumping jacks. Do this every day for 30 days and you\'ll see incredible results. Tag your friends and let\'s do this together!',
    created_at: '2024-01-13T06:45:00Z',
    views: 3200000,
    likes: 250000,
    shares: 67000
  },
  {
    id: 'tiktok-4',
    title: 'Study Tips for College Students',
    description: 'How I went from C\'s to A\'s with these study techniques!',
    content_type: 'tiktok',
    url: 'https://tiktok.com/@studentlife/video/901234',
    transcript: 'College students, this is for you! My top study tips that actually work: Use the Pomodoro technique, create mind maps, teach others what you learn, and always review within 24 hours. These methods helped me improve my GPA from 2.8 to 3.9!',
    created_at: '2024-01-12T14:20:00Z',
    views: 1500000,
    likes: 95000,
    shares: 22000
  },
  {
    id: 'tiktok-5',
    title: 'Budget-Friendly Meal Prep',
    description: 'Feed a family of 4 for $50 a week with these meal prep ideas!',
    content_type: 'tiktok',
    url: 'https://tiktok.com/@budgetcook/video/567890',
    transcript: 'Meal prep on a budget is totally possible! This week I spent $47 and made 20 meals. Key tips: Buy in bulk, use frozen vegetables, cook in batches, and repurpose leftovers. Here\'s my shopping list and prep schedule.',
    created_at: '2024-01-11T10:30:00Z',
    views: 2100000,
    likes: 140000,
    shares: 35000
  },

  // Instagram Posts
  {
    id: 'instagram-1',
    title: 'Sunset Photography Tips',
    description: 'Capture the perfect golden hour shot with these photography techniques!',
    content_type: 'instagram',
    url: 'https://instagram.com/p/ABC123',
    thumbnail_url: 'https://picsum.photos/seed/instagram1/400/300',
    created_at: '2024-01-15T18:45:00Z',
    views: 890000,
    likes: 67000,
    shares: 12000
  },
  {
    id: 'instagram-2',
    title: 'Sustainable Fashion Haul',
    description: 'Thrifted outfit that cost less than $30 but looks designer!',
    content_type: 'instagram',
    url: 'https://instagram.com/p/DEF456',
    thumbnail_url: 'https://picsum.photos/seed/instagram2/400/300',
    created_at: '2024-01-14T16:20:00Z',
    views: 1200000,
    likes: 89000,
    shares: 18000
  },
  {
    id: 'instagram-3',
    title: 'Home Decor Transformation',
    description: 'Before and after: How I transformed my living room for under $500!',
    content_type: 'instagram',
    url: 'https://instagram.com/p/GHI789',
    thumbnail_url: 'https://picsum.photos/seed/instagram3/400/300',
    created_at: '2024-01-13T11:15:00Z',
    views: 950000,
    likes: 72000,
    shares: 15000
  },
  {
    id: 'instagram-4',
    title: 'Plant Care Guide',
    description: 'Keep your plants alive with these essential care tips!',
    content_type: 'instagram',
    url: 'https://instagram.com/p/JKL012',
    thumbnail_url: 'https://picsum.photos/seed/instagram4/400/300',
    created_at: '2024-01-12T09:30:00Z',
    views: 750000,
    likes: 56000,
    shares: 11000
  },
  {
    id: 'instagram-5',
    title: 'Skincare Routine for Acne',
    description: 'My 3-step routine that cleared my skin in 2 weeks!',
    content_type: 'instagram',
    url: 'https://instagram.com/p/MNO345',
    thumbnail_url: 'https://picsum.photos/seed/instagram5/400/300',
    created_at: '2024-01-11T13:45:00Z',
    views: 1100000,
    likes: 82000,
    shares: 20000
  },

  // Twitter Posts
  {
    id: 'twitter-1',
    title: 'Tech Industry Insights',
    description: 'Thoughts on the future of AI and its impact on jobs',
    content_type: 'twitter',
    url: 'https://twitter.com/techguru/status/123456789',
    thumbnail_url: 'https://picsum.photos/seed/twitter1/400/300',
    post_text: 'AI isn\'t taking our jobs - it\'s changing them. The key is adaptation. Here\'s what I\'ve learned from working with AI tools for the past year: 1/5',
    post_description: 'A thread on how AI is reshaping the workplace and what we need to do about it.',
    created_at: '2024-01-15T10:30:00Z',
    views: 450000,
    likes: 34000,
    shares: 8900
  },
  {
    id: 'twitter-2',
    title: 'Startup Lessons Learned',
    description: '5 years of building startups - here\'s what actually matters',
    content_type: 'twitter',
    url: 'https://twitter.com/startupfounder/status/987654321',
    thumbnail_url: 'https://picsum.photos/seed/twitter2/400/300',
    post_text: 'After 5 years and 3 startups, here are the lessons that actually matter: 1. Focus on customer problems, not your solution 2. Launch early, iterate fast 3. Build a team that shares your vision 4. Cash flow is king 5. Mental health > everything else',
    post_description: 'Reflections on the startup journey and what I wish I knew earlier.',
    created_at: '2024-01-14T14:15:00Z',
    views: 380000,
    likes: 28000,
    shares: 7200
  },
  {
    id: 'twitter-3',
    title: 'Climate Change Action',
    description: 'What individuals can do to make a real difference',
    content_type: 'twitter',
    url: 'https://twitter.com/climateactivist/status/555666777',
    thumbnail_url: 'https://picsum.photos/seed/twitter3/400/300',
    post_text: 'Climate anxiety is real, but action is the antidote. Here\'s what you can do TODAY: 1. Switch to renewable energy 2. Reduce meat consumption 3. Use public transport 4. Support climate-friendly businesses 5. Vote for climate action',
    post_description: 'Practical steps everyone can take to combat climate change.',
    created_at: '2024-01-13T08:45:00Z',
    views: 520000,
    likes: 41000,
    shares: 12000
  },
  {
    id: 'twitter-4',
    title: 'Mental Health Awareness',
    description: 'Breaking the stigma around mental health in the workplace',
    content_type: 'twitter',
    url: 'https://twitter.com/mentalhealthadvocate/status/111222333',
    thumbnail_url: 'https://picsum.photos/seed/twitter4/400/300',
    post_text: 'It\'s okay to not be okay. Mental health days are just as important as sick days. If you\'re struggling, please reach out. You\'re not alone. Resources in thread below.',
    post_description: 'Supporting mental health awareness and providing resources for those in need.',
    created_at: '2024-01-12T12:30:00Z',
    views: 290000,
    likes: 22000,
    shares: 5600
  },
  {
    id: 'twitter-5',
    title: 'Remote Work Productivity',
    description: 'How to stay productive when working from home',
    content_type: 'twitter',
    url: 'https://twitter.com/remoteworker/status/444555666',
    thumbnail_url: 'https://picsum.photos/seed/twitter5/400/300',
    post_text: 'Remote work productivity tips that actually work: 1. Set up a dedicated workspace 2. Use time blocking 3. Take regular breaks 4. Over-communicate with your team 5. Set clear boundaries between work and personal time',
    post_description: 'Proven strategies for maintaining productivity in a remote work environment.',
    created_at: '2024-01-11T09:20:00Z',
    views: 340000,
    likes: 26000,
    shares: 6800
  },

  // LinkedIn Posts
  {
    id: 'linkedin-1',
    title: 'Leadership in the Digital Age',
    description: 'How to lead effectively in a remote-first world',
    content_type: 'linkedin',
    url: 'https://linkedin.com/posts/leader123_leadership-remote-work-digital-transformation',
    thumbnail_url: 'https://picsum.photos/seed/linkedin1/400/300',
    created_at: '2024-01-15T07:30:00Z',
    views: 125000,
    likes: 8900,
    shares: 2300
  },
  {
    id: 'linkedin-2',
    title: 'Career Transition Success Story',
    description: 'From marketing to data science: My 2-year journey',
    content_type: 'linkedin',
    url: 'https://linkedin.com/posts/careerchanger_career-transition-data-science-learning',
    thumbnail_url: 'https://picsum.photos/seed/linkedin2/400/300',
    created_at: '2024-01-14T11:45:00Z',
    views: 98000,
    likes: 7200,
    shares: 1800
  },
  {
    id: 'linkedin-3',
    title: 'Building Company Culture',
    description: 'Culture eats strategy for breakfast - here\'s how we built ours',
    content_type: 'linkedin',
    url: 'https://linkedin.com/posts/culturebuilder_company-culture-employee-engagement-leadership',
    thumbnail_url: 'https://picsum.photos/seed/linkedin3/400/300',
    created_at: '2024-01-13T15:20:00Z',
    views: 156000,
    likes: 11000,
    shares: 2900
  },
  {
    id: 'linkedin-4',
    title: 'Sales Strategy Insights',
    description: 'The psychology behind successful sales conversations',
    content_type: 'linkedin',
    url: 'https://linkedin.com/posts/salesexpert_sales-psychology-consultative-selling',
    thumbnail_url: 'https://picsum.photos/seed/linkedin4/400/300',
    created_at: '2024-01-12T13:10:00Z',
    views: 89000,
    likes: 6500,
    shares: 1600
  },
  {
    id: 'linkedin-5',
    title: 'Innovation in Healthcare',
    description: 'How AI is transforming patient care and outcomes',
    content_type: 'linkedin',
    url: 'https://linkedin.com/posts/healthcareinnovator_ai-healthcare-patient-care-innovation',
    thumbnail_url: 'https://picsum.photos/seed/linkedin5/400/300',
    created_at: '2024-01-11T10:15:00Z',
    views: 112000,
    likes: 8200,
    shares: 2100
  }
]; 
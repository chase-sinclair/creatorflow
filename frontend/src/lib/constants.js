export const EXAMPLES = [
  {
    id: 1,
    title: 'Trend-to-Reel Pipeline',
    description: 'Scans TikTok weekly trends, generates short-form scripts, and auto-posts reels to Instagram and TikTok.',
    platforms: ['TikTok', 'Instagram'],
    persona: 'For Creators',
    archetype: 'trend_to_content',
    nodes: ['Trend Scanner', 'Script Writer', 'Video Renderer', 'Publisher'],
  },
  {
    id: 2,
    title: 'YouTube → Newsletter Repurposer',
    description: 'Pulls your latest YouTube video, extracts key insights, and sends a weekly email digest to your subscribers.',
    platforms: ['YouTube', 'Email'],
    persona: 'For Creators',
    archetype: 'source_transform_distribute',
    nodes: ['Video Ingester', 'Transcript Extractor', 'Summary Writer', 'Email Sender'],
  },
  {
    id: 3,
    title: 'Brand Mention Monitor',
    description: 'Watches Twitter and Reddit for brand mentions, drafts personalized replies, and sends a daily engagement report.',
    platforms: ['Twitter', 'Reddit'],
    persona: 'For Marketing Teams',
    archetype: 'monitor_engage_report',
    nodes: ['Mention Listener', 'Sentiment Classifier', 'Reply Drafter', 'Report Builder'],
  },
  {
    id: 4,
    title: 'Content Calendar Autopilot',
    description: 'Takes your content calendar, generates posts for each slot, and schedules them across LinkedIn and Twitter.',
    platforms: ['LinkedIn', 'Twitter'],
    persona: 'For Marketing Teams',
    archetype: 'schedule_generate_publish',
    nodes: ['Calendar Reader', 'Post Generator', 'Approver', 'Scheduler'],
  },
  {
    id: 5,
    title: 'Podcast Clip Machine',
    description: 'Transcribes your podcast episodes, finds the most shareable moments, and publishes short clips to social.',
    platforms: ['YouTube', 'Instagram', 'Twitter'],
    persona: 'For Podcasters',
    archetype: 'source_transform_distribute',
    nodes: ['Audio Ingester', 'Transcriber', 'Highlight Picker', 'Clip Publisher'],
  },
  {
    id: 6,
    title: 'Local Business Promoter',
    description: 'Monitors local events and seasonal hooks, creates relevant promotional posts, and publishes to Facebook and Instagram.',
    platforms: ['Facebook', 'Instagram'],
    persona: 'For Small Business',
    archetype: 'schedule_generate_publish',
    nodes: ['Event Scanner', 'Copy Writer', 'Image Generator', 'Publisher'],
  },
]

export const IDEA_PROMPTS = {
  'Solo Creator': [
    {
      id: 'c1',
      text: 'Automatically clip highlights from my weekly YouTube video and post them to TikTok and Instagram Reels.',
      archetype: 'source_transform_distribute',
    },
    {
      id: 'c2',
      text: 'Scan trending audio on TikTok each week and generate video concepts I can film — delivered to my inbox Monday morning.',
      archetype: 'trend_to_content',
    },
    {
      id: 'c3',
      text: 'Turn my Twitter threads into LinkedIn articles automatically and post them the same day.',
      archetype: 'source_transform_distribute',
    },
  ],
  'Marketing Team': [
    {
      id: 'm1',
      text: 'Monitor brand mentions across Twitter and Reddit, draft responses for my review, and send a daily summary report.',
      archetype: 'monitor_engage_report',
    },
    {
      id: 'm2',
      text: 'Pull from our content calendar and auto-generate LinkedIn and Twitter posts for every scheduled slot — human approval before publish.',
      archetype: 'schedule_generate_publish',
    },
    {
      id: 'm3',
      text: 'Watch competitor social accounts weekly and summarize their top-performing content into a brief for our team.',
      archetype: 'monitor_engage_report',
    },
  ],
  'Podcast Brand': [
    {
      id: 'p1',
      text: 'Transcribe each episode, pull the three best quotes, and create audiogram posts for Twitter and Instagram automatically.',
      archetype: 'source_transform_distribute',
    },
    {
      id: 'p2',
      text: 'After each episode publishes, generate a newsletter recap with key takeaways and send it to our subscriber list.',
      archetype: 'source_transform_distribute',
    },
    {
      id: 'p3',
      text: 'Clip my guest interviews into short highlight reels and schedule them as a drip campaign across the week.',
      archetype: 'schedule_generate_publish',
    },
  ],
  'Small Business': [
    {
      id: 'b1',
      text: 'Monitor local events and holidays, then generate timely promotional posts for our Facebook and Instagram pages.',
      archetype: 'schedule_generate_publish',
    },
    {
      id: 'b2',
      text: 'Watch for Google reviews mentioning our business and draft personal thank-you responses I can approve with one click.',
      archetype: 'monitor_engage_report',
    },
    {
      id: 'b3',
      text: 'Every time we add a new product, automatically create social posts for all our channels with photos and copy.',
      archetype: 'source_transform_distribute',
    },
  ],
}

export const PLATFORM_COLORS = {
  TikTok: 'bg-pink-900/40 text-pink-300 border-pink-700/40',
  Instagram: 'bg-purple-900/40 text-purple-300 border-purple-700/40',
  YouTube: 'bg-red-900/40 text-red-300 border-red-700/40',
  Twitter: 'bg-sky-900/40 text-sky-300 border-sky-700/40',
  LinkedIn: 'bg-blue-900/40 text-blue-300 border-blue-700/40',
  Facebook: 'bg-blue-900/40 text-blue-300 border-blue-700/40',
  Reddit: 'bg-orange-900/40 text-orange-300 border-orange-700/40',
  Email: 'bg-green-900/40 text-green-300 border-green-700/40',
}

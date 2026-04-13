-- CreatorFlow database schema
-- Run this in the Supabase SQL editor (https://supabase.com/dashboard → SQL editor)

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_idea TEXT NOT NULL,
  clarifying_questions JSONB DEFAULT '[]',
  clarifying_answers JSONB DEFAULT '[]',
  question_round INT DEFAULT 0,
  idea_summary TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id),
  workflow_json JSONB NOT NULL,
  summary_brief TEXT,
  archetype VARCHAR(50),
  platforms TEXT[],
  automation_level VARCHAR(20),
  refinement_history JSONB DEFAULT '[]',
  share_token VARCHAR(20) UNIQUE,
  view_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS examples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(100) NOT NULL,
  description TEXT,
  persona VARCHAR(50),
  archetype VARCHAR(50),
  platforms TEXT[],
  workflow_json JSONB NOT NULL,
  display_order INT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS idea_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona VARCHAR(50),
  prompt_text TEXT NOT NULL,
  archetype VARCHAR(50),
  platforms TEXT[],
  display_order INT
);

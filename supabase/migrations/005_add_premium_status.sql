-- ============================================
-- Migration: Add Premium Status
-- Description: Adds is_premium column to users and anonymous_users tables for freemium payment model (Epic 7)
-- ============================================

-- Add is_premium column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;

-- Add is_premium column to anonymous_users table
ALTER TABLE public.anonymous_users 
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;

-- Create partial index for premium users (for efficient premium status queries)
-- Only indexes rows where is_premium = TRUE, keeping index small and performant
CREATE INDEX IF NOT EXISTS idx_users_premium ON public.users(is_premium) WHERE is_premium = TRUE;

-- Create partial index for premium anonymous users (for consistency and future-proofing)
CREATE INDEX IF NOT EXISTS idx_anonymous_users_premium ON public.anonymous_users(is_premium) WHERE is_premium = TRUE;

-- ============================================
-- END OF MIGRATION
-- ============================================

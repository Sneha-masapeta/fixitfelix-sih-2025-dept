/*
  # Update issues table with new fields

  1. Changes
    - Add category field for issue categorization
    - Add priority field for issue priority levels
    - Update status field with better default
    - Add indexes for better performance
  
  2. Security
    - Maintain existing RLS policies
*/

-- Add new columns to issues table
DO $$
BEGIN
  -- Add category column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'issues' AND column_name = 'category'
  ) THEN
    ALTER TABLE issues ADD COLUMN category text;
  END IF;

  -- Add priority column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'issues' AND column_name = 'priority'
  ) THEN
    ALTER TABLE issues ADD COLUMN priority text DEFAULT 'medium';
  END IF;
END $$;

-- Update status column default if needed
ALTER TABLE issues ALTER COLUMN status SET DEFAULT 'open';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_issues_category ON issues(category);
CREATE INDEX IF NOT EXISTS idx_issues_priority ON issues(priority);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_created_at ON issues(created_at);
CREATE INDEX IF NOT EXISTS idx_issues_user_id ON issues(user_id);

-- Add check constraints for valid values
DO $$
BEGIN
  -- Add category constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'issues_category_check'
  ) THEN
    ALTER TABLE issues ADD CONSTRAINT issues_category_check 
    CHECK (category IN ('pothole', 'streetlight', 'traffic', 'sidewalk', 'graffiti', 'garbage', 'water', 'park', 'other'));
  END IF;

  -- Add priority constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'issues_priority_check'
  ) THEN
    ALTER TABLE issues ADD CONSTRAINT issues_priority_check 
    CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
  END IF;

  -- Add status constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'issues_status_check'
  ) THEN
    ALTER TABLE issues ADD CONSTRAINT issues_status_check 
    CHECK (status IN ('open', 'in-progress', 'resolved', 'closed'));
  END IF;
END $$;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'severity_level') THEN
    CREATE TYPE severity_level AS ENUM ('low', 'medium', 'high');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  original_s3_key TEXT NOT NULL,
  original_filename TEXT,
  content_type TEXT,
  file_size_bytes INTEGER,

  location_text TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,

  road_type TEXT,
  captured_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_saved BOOLEAN NOT NULL DEFAULT FALSE,

  detection_count INTEGER NOT NULL DEFAULT 0,
  max_severity severity_level,
  avg_confidence NUMERIC(5, 4)
);

CREATE TABLE IF NOT EXISTS detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,

  detection_index INTEGER NOT NULL,

  x NUMERIC(8, 6) NOT NULL CHECK (x >= 0 AND x <= 1),
  y NUMERIC(8, 6) NOT NULL CHECK (y >= 0 AND y <= 1),
  w NUMERIC(8, 6) NOT NULL CHECK (w >= 0 AND w <= 1),
  h NUMERIC(8, 6) NOT NULL CHECK (h >= 0 AND h <= 1),

  confidence NUMERIC(5, 4) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  severity severity_level NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (analysis_id, detection_index)
);

CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_max_severity ON analyses(max_severity);
CREATE INDEX IF NOT EXISTS idx_analyses_coordinates ON analyses(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_analyses_is_saved ON analyses(is_saved);
CREATE INDEX IF NOT EXISTS idx_detections_analysis_id ON detections(analysis_id);
CREATE INDEX IF NOT EXISTS idx_detections_severity ON detections(severity);

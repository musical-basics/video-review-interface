-- Table to store video metadata
create table videos (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  r2_key text not null, -- This is the path in your bucket (e.g. "my-video.mp4")
  duration float, -- Duration in seconds
  status text default 'ready',
  created_at timestamptz default now()
);

-- Table to store comments & drawings
create table comments (
  id uuid primary key default gen_random_uuid(),
  video_id uuid references videos(id) on delete cascade,
  timestamp float not null, -- The exact second (e.g. 2.345)
  text text, 
  drawing_data jsonb, -- This stores the Fabric.js/Canvas paths
  type text default 'general', -- 'drawing', 'text', 'replacement'
  author_name text default 'Reviewer',
  created_at timestamptz default now()
);

-- Create assets table
create table assets (
  id uuid default uuid_generate_v4() primary key,
  filename text not null,
  r2_key text not null,
  size bigint not null,
  content_type text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table assets enable row level security;

-- Create policy to allow access (Public for now for simplicity, or authenticated)
create policy "Allow public access" on assets for select using (true);
create policy "Allow insert" on assets for insert with check (true);

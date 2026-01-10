-- Supabase Database Schema for HomeTasks Tracker
-- Run this SQL in your Supabase SQL Editor to create the necessary tables

-- Create profiles table to store user roles
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id BIGSERIAL PRIMARY KEY,
    room TEXT NOT NULL,
    task TEXT NOT NULL,
    frequency TEXT NOT NULL CHECK (frequency IN ('Weekly', 'Monthly', 'Quarterly')),
    last_completed DATE,
    next_due DATE NOT NULL,
    completed_this_cycle BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Profiles policies: Users can read all profiles, but only update their own
CREATE POLICY "Users can view all profiles"
    ON profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Tasks policies: All authenticated users can read and write tasks
CREATE POLICY "Authenticated users can view all tasks"
    ON tasks FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert tasks"
    ON tasks FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update tasks"
    ON tasks FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete tasks"
    ON tasks FOR DELETE
    USING (auth.role() = 'authenticated');

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    username_text TEXT;
BEGIN
    -- Extract username from email (format: username@hometasks.local)
    username_text := SPLIT_PART(NEW.email, '@', 1);
    
    -- Fallback to email if no @ found, or use metadata if provided
    IF username_text IS NULL OR username_text = '' THEN
        username_text := COALESCE(NEW.raw_user_meta_data->>'username', NEW.email);
    END IF;
    
    INSERT INTO public.profiles (id, username, role)
    VALUES (
        NEW.id,
        username_text,
        COALESCE(NEW.raw_user_meta_data->>'role', 'user')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call the function on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Insert default admin user (you'll need to create this user in Supabase Auth first)
-- Then run this to set their role:
-- UPDATE profiles SET role = 'admin' WHERE username = 'admin';


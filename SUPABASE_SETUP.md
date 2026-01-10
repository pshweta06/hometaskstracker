# Supabase Setup Guide

This guide will help you set up Supabase for the HomeTasks Tracker application.

## Prerequisites

1. A Supabase account (sign up at https://supabase.com)
2. A new Supabase project created

## Step 1: Create Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in your project details:
   - Name: `hometasks-tracker` (or any name you prefer)
   - Database Password: Choose a strong password (save this!)
   - Region: Choose the closest region to you
4. Click "Create new project" and wait for it to be ready (2-3 minutes)

## Step 2: Get Your API Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (under "Project URL")
   - **anon/public key** (under "Project API keys" → "anon public")

## Step 3: Configure the Application

1. Open `supabase-config.js` in your project
2. Replace the placeholder values:
   ```javascript
   const SUPABASE_URL = 'YOUR_SUPABASE_URL';  // Paste your Project URL here
   const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';  // Paste your anon key here
   ```

## Step 4: Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the entire contents of `database-schema.sql`
4. Click "Run" (or press Ctrl/Cmd + Enter)
5. Verify that the tables were created:
   - Go to **Table Editor** → You should see `profiles` and `tasks` tables

## Step 5: Configure Authentication Settings

1. Go to **Authentication** → **Settings** in your Supabase dashboard
2. Under "Auth Providers" → "Email":
   - **Enable Email provider**: Make sure this is enabled
   - **Confirm email**: For development, you can disable this (uncheck "Enable email confirmations")
   - For production, keep email confirmations enabled
3. Scroll down and click "Save"

## Step 6: Create Default Admin User

1. Go to **Authentication** → **Users** in your Supabase dashboard
2. Click "Add user" → "Create new user"
3. Fill in:
   - **Email**: `admin@hometasks.local`
   - **Password**: `admin123` (or your preferred password)
   - **Auto Confirm User**: Check this box (if email confirmation is disabled, this is automatic)
4. Click "Create user"
5. Copy the User UID (you'll need this)
6. Go to **SQL Editor** and run:
   ```sql
   UPDATE profiles 
   SET role = 'admin' 
   WHERE username = 'admin';
   ```
   
   **Note**: The trigger should have created a profile automatically. If the username isn't 'admin', you may need to update it:
   ```sql
   UPDATE profiles 
   SET username = 'admin', role = 'admin' 
   WHERE id = 'YOUR_USER_UID_HERE';
   ```

## Step 7: Test the Application

1. Open `index.html` in your browser
2. Try logging in with:
   - **Username**: `admin`
   - **Password**: `admin123` (or whatever you set)
3. If login works, you're all set!

## Troubleshooting

### "Invalid API key" error
- Double-check that you copied the correct `anon` key (not the `service_role` key)
- Make sure there are no extra spaces in `supabase-config.js`

### "relation does not exist" error
- Make sure you ran the SQL schema file completely
- Check the SQL Editor for any error messages

### Login not working
- Verify the user was created in Authentication → Users
- Check that the profile was created in Table Editor → profiles
- Make sure the username matches what you're trying to log in with

### Tasks not loading
- Check browser console for errors
- Verify Row Level Security (RLS) policies are enabled
- Make sure you're logged in (tasks require authentication)

## Security Notes

- The `anon` key is safe to use in client-side code (it's public)
- Row Level Security (RLS) policies ensure users can only access their own data
- Never commit your `service_role` key to version control
- Consider changing the default admin password in production

## Migration from localStorage

If you had existing data in localStorage:
1. Export your tasks from localStorage (use browser DevTools)
2. After setting up Supabase, you can use the "Re-import CSV Data" button in the Admin Panel
3. Or manually import tasks through the Supabase dashboard

## Next Steps

- Set up email authentication (optional)
- Configure custom domain (optional)
- Set up backups (recommended for production)


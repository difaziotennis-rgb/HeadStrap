# Supabase Storage Setup for Profile Pictures

This guide will help you set up Supabase Storage to enable direct image uploads for player profile pictures.

## Step 1: Create Storage Bucket

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click on **Storage** in the left sidebar
4. Click **New bucket**
5. Configure the bucket:
   - **Name**: `player-profiles`
   - **Public bucket**: ✅ **Enable this** (so images can be accessed via URL)
   - **File size limit**: 5 MB (or your preferred limit)
   - **Allowed MIME types**: `image/jpeg,image/jpg,image/png,image/gif,image/webp`
6. Click **Create bucket**

## Step 2: Set Up Storage Policies

1. In the Storage section, click on the `player-profiles` bucket
2. Go to the **Policies** tab
3. Click **New Policy**
4. Create a policy to allow uploads (for authenticated club admins):

**Policy Name**: `Allow authenticated uploads`

**Policy Definition**:
```sql
-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'player-profiles');
```

5. Create a policy to allow public reads:

**Policy Name**: `Allow public reads`

**Policy Definition**:
```sql
-- Allow public to read files
CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'player-profiles');
```

6. Create a policy to allow updates (for replacing images):

**Policy Name**: `Allow authenticated updates`

**Policy Definition**:
```sql
-- Allow authenticated users to update their own files
CREATE POLICY "Allow authenticated updates"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'player-profiles');
```

7. Create a policy to allow deletes (for cleanup):

**Policy Name**: `Allow authenticated deletes`

**Policy Definition**:
```sql
-- Allow authenticated users to delete files
CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'player-profiles');
```

## Step 3: Alternative - Simple Public Access (Easier)

If you want to keep it simple and allow all operations (since we handle authentication in the API):

### Option A: Using the Policy Builder (Recommended)

1. Go to **Storage** → Click on `player-profiles` bucket → **Policies** tab
2. Click **New Policy**
3. Select **For full customization**
4. In the policy editor, enter ONLY this (without CREATE POLICY statement):

```sql
bucket_id = 'player-profiles'
```

5. Set:
   - **Policy name**: `Allow all operations`
   - **Allowed operation**: `ALL`
   - **Target roles**: `public`
   - **USING expression**: `bucket_id = 'player-profiles'`
   - **WITH CHECK expression**: `bucket_id = 'player-profiles'`

### Option B: Using SQL Editor (Alternative)

If the policy builder doesn't work, use the SQL Editor:

1. Go to **SQL Editor** in Supabase Dashboard
2. Click **New query**
3. Run this SQL:

```sql
-- Create policy for storage bucket
CREATE POLICY "Allow all operations on player-profiles"
ON storage.objects
FOR ALL
TO public
USING (bucket_id = 'player-profiles')
WITH CHECK (bucket_id = 'player-profiles');
```

⚠️ **Note**: This makes the bucket publicly accessible. Since we handle authentication in the API endpoint (`/api/upload/profile-picture`), this is safe. The API checks for club admin authentication before allowing uploads.

## Step 4: Test the Upload

1. Go to your ladder admin page: `https://difaziotennis.com/club/rhinebeck-tennis-club/ladder-admin`
2. Log in as club admin
3. Click **Edit** next to Cyrus (or any player)
4. Click **Choose File** under Profile Picture
5. Select an image file
6. Click **Upload**
7. The image should upload and appear in the preview
8. Click **Save Changes**

## Troubleshooting

### "Failed to upload image" error
- Check that the bucket name is exactly `player-profiles` (case-sensitive)
- Verify the bucket is set to **Public**
- Check that storage policies are set up correctly

### "Unauthorized" error
- Make sure you're logged in as a club admin
- Check that the club admin session cookie is set

### Images not displaying
- Verify the bucket is set to **Public**
- Check the public URL is being generated correctly
- Look at browser console for CORS errors

## File Size Limits

The current setup allows files up to 5MB. To change this:
1. Go to Storage → `player-profiles` bucket
2. Edit the bucket settings
3. Change the **File size limit**

## Supported Image Formats

- JPEG/JPG
- PNG
- GIF
- WebP

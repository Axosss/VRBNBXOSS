# 🗄️ Database Setup Guide for VRBNBXOSS

## Quick Setup Instructions

### Option 1: Using Supabase Dashboard (Recommended for Quick Setup)

1. **Go to your Supabase Dashboard**
   - Open https://supabase.com/dashboard
   - Select your project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Migration Script**
   - Copy the entire contents of `/supabase/migrations/001_initial_schema.sql`
   - Paste it into the SQL Editor
   - Click "Run" (or press Cmd/Ctrl + Enter)

4. **Verify Setup**
   - Go to "Table Editor" in the sidebar
   - You should see the following tables:
     - `profiles`
     - `apartments`
     - `guests`
     - `reservations`
     - `cleaners`
     - `cleanings`
     - `amenities_reference`

### Option 2: Using Supabase CLI (For Development)

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your project
supabase link --project-ref fdfigwvbawfaefmdhxaj

# Run migrations
supabase db push

# Or run directly
supabase db reset
```

### Option 3: Direct SQL Execution

If you prefer to run the SQL directly in the Supabase SQL Editor:

1. Go to: https://supabase.com/dashboard/project/fdfigwvbawfaefmdhxaj/sql
2. Create a new query
3. Copy and paste the migration script
4. Click "Run"

## 📊 Database Schema Overview

### Tables Created

| Table | Description |
|-------|-------------|
| **profiles** | User profiles extending Supabase auth |
| **apartments** | Property listings with details |
| **guests** | Guest information management |
| **reservations** | Booking records across platforms |
| **cleaners** | Cleaning service providers |
| **cleanings** | Cleaning schedule and tracking |
| **amenities_reference** | Standard amenities list |

### Security Features

- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Users can only access their own data
- ✅ Automatic updated_at timestamps
- ✅ Encrypted access codes
- ✅ Data validation constraints

### Storage Bucket

- **Bucket Name**: `apartments`
- **Purpose**: Store apartment photos
- **Access**: Public read, authenticated write

## 🔍 Verification Steps

After running the migration, verify everything is working:

### 1. Check Tables Exist
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

### 2. Check RLS Policies
```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

### 3. Check Storage Bucket
```sql
SELECT * FROM storage.buckets WHERE id = 'apartments';
```

### 4. Test the Application
- Go to http://localhost:3000/dashboard/apartments
- Try creating a new apartment
- Upload photos
- Save the apartment

## ⚠️ Troubleshooting

### Error: "Could not find the table 'public.apartments'"
- **Solution**: Run the migration script in SQL Editor

### Error: "permission denied for schema public"
- **Solution**: Make sure you're using the correct project and have admin access

### Error: "duplicate key value violates unique constraint"
- **Solution**: The schema is already partially created. Drop existing tables first:
```sql
-- CAUTION: This will delete all data!
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

### Error: "storage bucket not found"
- **Solution**: The storage bucket creation might have failed. Create it manually in Storage settings.

## 🚀 Next Steps

Once the database is set up:

1. **Refresh your application**
   - Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

2. **Test apartment creation**
   - Go to: http://localhost:3000/dashboard/apartments
   - Click "Add New Property"
   - Fill in the form and save

3. **Verify data in Supabase**
   - Check Table Editor to see your created apartments
   - Check Storage to see uploaded photos

## 📝 Important Notes

- The migration script includes sample data for amenities
- All sensitive data (access codes) are stored encrypted
- The schema supports multi-tenancy with RLS
- Automatic timestamps are managed by triggers

## 🔐 Security Considerations

- Never expose your service role key in client-side code
- Always use RLS policies for data access control
- Regularly backup your database
- Monitor usage in Supabase dashboard

---

**Need Help?** Check the Supabase logs in the Dashboard under "Logs" → "Postgres" for detailed error messages.
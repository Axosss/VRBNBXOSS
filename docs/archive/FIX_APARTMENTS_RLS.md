# Fix for Apartments RLS Infinite Recursion Error

## Problem
The error "infinite recursion detected in policy for relation 'apartments'" occurs when Row Level Security (RLS) policies have circular dependencies.

## Temporary Fix (Already Applied)
The API route `/api/apartments/route.ts` has been updated with a fallback mechanism that will:
1. Detect the infinite recursion error
2. Use a simpler query without complex RLS checks
3. Still ensure users only see their own apartments

## Permanent Fix - Database Migration

### Option 1: Via Supabase Dashboard (Recommended)
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Run the following SQL commands:

```sql
-- Fix infinite recursion in apartments RLS policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own apartments" ON apartments;
DROP POLICY IF EXISTS "Users can create their own apartments" ON apartments;  
DROP POLICY IF EXISTS "Users can update their own apartments" ON apartments;
DROP POLICY IF EXISTS "Users can delete their own apartments" ON apartments;

-- Create simplified RLS policies without recursion
CREATE POLICY "apartments_select_policy" ON apartments
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "apartments_insert_policy" ON apartments
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "apartments_update_policy" ON apartments
  FOR UPDATE USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "apartments_delete_policy" ON apartments
  FOR DELETE USING (auth.uid() = owner_id);
```

### Option 2: Via Supabase CLI
If you have the Supabase CLI configured with your project:

```bash
# Link to your project (if not already linked)
npx supabase link --project-ref [your-project-ref]

# Apply the migration
npx supabase db push
```

## Testing
After applying the fix, test the apartments page:
1. Navigate to http://localhost:3000/dashboard/apartments
2. The page should load without errors
3. You should see your apartments list

## Root Cause
The infinite recursion typically happens when:
- RLS policies reference other tables that also have RLS policies
- Those referenced tables' policies reference back to the original table
- Creating a circular dependency

The fix simplifies the policies to only check the owner_id directly without complex joins or subqueries.
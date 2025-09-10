# Apply Public Viewing Policies - Quick Guide

## Option 1: Via Supabase Dashboard (Easiest)

1. **Open Supabase SQL Editor:**
   https://supabase.com/dashboard/project/fdfigwvbawfaefmdhxaj/sql/new

2. **Copy this SQL and paste it in the editor:**

```sql
-- Enable public viewing of apartments
CREATE POLICY "Public users can view apartment details" ON apartments
  FOR SELECT
  USING (true);

-- Enable public viewing of reservations (for calendar)
CREATE POLICY "Public users can view reservation dates" ON reservations
  FOR SELECT
  USING (true);
```

3. **Click "Run"** button

4. **Test your public pages:**
   - Boccador: http://localhost:3000/p/63561c46-cbc2-4340-8f51-9c798fde898a
   - Montaigne: http://localhost:3000/p/987be56d-3c36-42a9-89a6-2a06300a59e9

## Option 2: Configure Supabase MCP (For Future Use)

1. Get your access token from:
   https://supabase.com/dashboard/account/tokens

2. Configure Claude:
   ```bash
   claude mcp add supabase --access-token YOUR_TOKEN
   ```

## Verify It's Working

Run this test:
```bash
node test-public-page.js
```

You should see the apartment details without any authentication errors!
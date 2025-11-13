# Migration Scripts

This directory contains data migration scripts for the MSME Mitr application.

## Schemes Data Migration

### Overview

The `migrate-schemes.ts` script migrates government scheme data from `data/schemes.json` to the Supabase database.

### Prerequisites

1. **Supabase Project Setup**: Ensure your Supabase project is configured and the database schema is deployed.

2. **Environment Variables**: Add the following to your `.env.local` file:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

   **⚠️ Important**: The `SUPABASE_SERVICE_ROLE_KEY` is required for this migration script. You can find it in:
   - Supabase Dashboard → Your Project → Settings → API → `service_role` key
   - **Never commit this key to version control!**

3. **Database Schema**: Ensure the `schemes` table exists in your database by running the migration:
   ```bash
   # Apply the schema migration in Supabase Dashboard or via CLI
   ```

### Usage

Run the migration script:

```bash
npm run migrate:schemes
```

Or directly with tsx:

```bash
npx tsx scripts/migrate-schemes.ts
```

### What the Script Does

1. **Reads** the `data/schemes.json` file
2. **Deduplicates** schemes based on name and URL
3. **Transforms** the data to match the database schema:
   - Converts text fields to JSONB where appropriate
   - Extracts categories from ministry names
   - Identifies target audiences from tags
   - Extracts financial details from scheme descriptions
4. **Checks** for existing schemes in the database
5. **Inserts** only new schemes (avoids duplicates)
6. **Verifies** data integrity after insertion
7. **Reports** a detailed summary

### Data Transformation

The script transforms JSON scheme data as follows:

| JSON Field | Database Field | Transformation |
|------------|----------------|----------------|
| `scheme_name` | `scheme_name` | Direct mapping |
| `scheme_url` | `scheme_url` | Direct mapping |
| `ministry` | `ministry` | Direct mapping |
| `description` | `description` | Direct mapping |
| `ministry` | `category` | Extracted (e.g., "MSME", "Finance") |
| `tags` | `tags` | Array field |
| `tags` | `target_audience` | Filtered for audience keywords |
| `details` | `details` | JSONB with content and sources |
| `benefits` | `benefits` | JSONB with content |
| `eligibility` | `eligibility` | JSONB with content |
| `application_process` | `application_process` | JSONB (nullable) |
| `documents_required` | `documents_required` | JSONB (nullable) |
| `details` | `financial_details` | Extracted from text |

### Output Example

```
🚀 Starting schemes data migration...

📖 Reading schemes.json file...
✅ Found 11 schemes in JSON file
   Source: https://www.myscheme.gov.in/...
   Extraction Date: 2025-11-07T22:14:03.643857

🔍 Removing duplicate schemes...
✅ 10 unique schemes after deduplication

🔄 Transforming scheme data...
✅ Transformed 10 schemes

🔍 Checking existing schemes in database...
   Found 0 existing schemes in database

📝 Inserting 10 new schemes into database...

   Processing batch 1/1 (10 schemes)...
   ✅ Batch 1 inserted successfully

🔍 Verifying data integrity...
✅ Total schemes in database: 10

📊 Migration Summary:
   Total schemes in JSON: 11
   Unique schemes: 10
   Already in database: 0
   New schemes inserted: 10
   Final database count: 10

✨ Migration completed successfully!
```

### Re-running the Migration

The script is **idempotent** - you can run it multiple times safely:
- It checks for existing schemes before inserting
- Only new schemes are added
- Existing schemes are skipped

### Troubleshooting

**Error: Missing environment variables**
- Ensure `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set in `.env.local`

**Error: Schemes file not found**
- Verify `data/schemes.json` exists in the project root

**Error: Failed to fetch existing schemes**
- Check your Supabase connection
- Verify the `schemes` table exists in your database
- Ensure RLS policies allow service role access

**Error: Failed to insert schemes**
- Check the database schema matches the expected structure
- Review the error message for specific field issues
- Verify the service role key has write permissions

### Data Verification

After migration, verify the data in Supabase:

1. Go to Supabase Dashboard → Table Editor → `schemes`
2. Check that schemes are present
3. Verify JSONB fields are properly formatted
4. Test queries:
   ```sql
   -- Count total schemes
   SELECT COUNT(*) FROM schemes;
   
   -- View schemes by category
   SELECT category, COUNT(*) FROM schemes GROUP BY category;
   
   -- Search by tags
   SELECT scheme_name FROM schemes WHERE 'MSME' = ANY(tags);
   ```

### Next Steps

After successful migration:
1. Update the scheme service to fetch from database instead of JSON
2. Implement search and filtering functionality
3. Add caching for frequently accessed schemes
4. Consider adding a scheme refresh/update mechanism


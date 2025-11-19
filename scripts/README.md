# Scripts Directory

This directory contains utility scripts for the MSME Mitr application, including data migration, admin user creation, and background job processing.

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

---

## Admin User Creation

### Overview

The `create-admin-user.ts` script creates an admin user with elevated privileges for accessing the admin dashboard.

### Usage

```bash
npm run create-admin
```

Or with custom email:

```bash
EMAIL=admin@example.com npm run create-admin
```

See the script file for more details.

---

## Extraction Job Processor

### Overview

The `process-extraction-jobs.ts` script is a background service that processes extraction jobs from the queue. It extracts structured business information from MSME conversations with multilingual support.

### Quick Start

**Run once (single batch):**
```bash
npm run process-jobs
```

**Run continuously (watch mode):**
```bash
npm run process-jobs:watch
```

### Features

- Batch processing with configurable batch size
- Priority-based job processing
- Automatic retry with exponential backoff
- Graceful shutdown handling
- Real-time metrics and queue statistics
- Comprehensive logging

### Configuration

Configure via environment variables:

```env
EXTRACTION_BATCH_SIZE=10           # Jobs per batch
EXTRACTION_POLL_INTERVAL=10        # Polling interval (seconds)
EXTRACTION_MAX_RETRIES=3           # Max retry attempts
EXTRACTION_MODEL=openai/gpt-4o-mini
EXTRACTION_CONFIDENCE_THRESHOLD=0.5
OPENROUTER_API_KEY=your_api_key
```

### Documentation

For detailed documentation, see:
- **[EXTRACTION_JOB_PROCESSOR.md](./EXTRACTION_JOB_PROCESSOR.md)** - Complete usage guide, monitoring, and troubleshooting
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Production deployment options and best practices

### Deployment Options

1. **PM2** (Recommended) - Process manager with monitoring
2. **Docker** - Containerized deployment
3. **Systemd** - Linux service
4. **Cron** - Periodic execution
5. **Cloud Functions** - Serverless (Vercel, AWS Lambda)

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for setup instructions.

### Monitoring

The processor provides:
- Real-time processing metrics
- Queue statistics
- Success/failure rates
- Performance metrics
- Detailed logging

Example output:
```
======================================================================
PROCESSING METRICS
======================================================================
Uptime:           2h 15m 30s
Cycles Completed: 135
Total Processed:  450
  ✓ Succeeded:    425
  ✗ Failed:       15
  ⊘ Skipped:      10
Success Rate:     94.4%
Avg Cycle Time:   3.45s
Last Processed:   2025-01-17 14:30:45
======================================================================
```

### Production Deployment

For production, use PM2:

```bash
# Install PM2
npm install -g pm2

# Start processor
pm2 start npm --name "msme-mitr-jobs" -- run process-jobs:watch

# Save configuration
pm2 save

# Setup auto-start on boot
pm2 startup
```

Monitor with:
```bash
pm2 status
pm2 logs msme-mitr-jobs
pm2 monit
```

---

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Migrate Schemes | `npm run migrate:schemes` | Migrate scheme data to database |
| Verify Schemes | `npm run verify:schemes` | Verify scheme migration |
| Create Admin | `npm run create-admin` | Create admin user |
| Process Jobs | `npm run process-jobs` | Process extraction jobs (once) |
| Process Jobs Watch | `npm run process-jobs:watch` | Process jobs continuously |

---

## Troubleshooting

### Common Issues

**Missing environment variables:**
- Ensure `.env.local` contains all required variables
- Check Supabase credentials are correct

**Database connection errors:**
- Verify Supabase project is active
- Check network connectivity
- Ensure migrations are applied

**Job processor not starting:**
- Check OpenRouter API key is valid
- Verify Node.js version (requires 18+)
- Review logs for specific errors

### Getting Help

1. Check the relevant documentation file
2. Review error logs
3. Verify environment configuration
4. Contact the development team


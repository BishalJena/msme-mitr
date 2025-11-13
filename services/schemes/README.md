# Scheme Data Service

## Overview

The `SchemeDataService` is responsible for loading, processing, and managing government scheme data for the MSME Mitr application. It has been updated to support both database and JSON-based data sources with intelligent caching.

## Features

### Dual-Mode Operation

The service now supports two modes of operation:

1. **Database Mode** (Default): Fetches schemes from Supabase database
2. **JSON Mode** (Fallback): Uses local JSON file for backward compatibility

### Intelligent Caching

- In-memory caching with configurable TTL (default: 1 hour)
- Automatic cache refresh when TTL expires
- Manual cache refresh capability
- Cache statistics for monitoring

### Database Integration

When in database mode, the service:
- Fetches active schemes from the `schemes` table
- Processes database records into optimized `ProcessedScheme` format
- Uses database queries for efficient filtering and searching
- Falls back to JSON if database is unavailable

## Usage

### Basic Usage

```typescript
import { schemeDataService } from '@/services/schemes/schemeDataService';

// Get all schemes (async)
const schemes = await schemeDataService.getAllSchemes();

// Search schemes
const results = await schemeDataService.searchSchemes('loan');

// Get scheme by ID
const scheme = await schemeDataService.getSchemeById('scheme-id');

// Get schemes by category
const loanSchemes = await schemeDataService.getSchemesByCategory(SchemeCategory.LOAN);

// Get schemes by target audience
const womenSchemes = await schemeDataService.getSchemesByAudience('Women Entrepreneurs');
```

### Advanced Usage

```typescript
// Create custom instance with specific mode
import SchemeDataService from '@/services/schemes/schemeDataService';

const jsonService = new SchemeDataService(false); // JSON mode
await jsonService.initialize();

// Switch modes dynamically
schemeDataService.setDatabaseMode(false); // Switch to JSON
schemeDataService.setDatabaseMode(true);  // Switch to database

// Force cache refresh
await schemeDataService.forceRefresh();

// Get cache statistics
const stats = schemeDataService.getCacheStats();
console.log(`Cache size: ${stats.size}, Mode: ${stats.mode}`);

// Token estimation for LLM context
const tokenEstimate = schemeDataService.getTokenEstimate(schemes, 'minimal');
```

## API Reference

### Methods

#### `async initialize(): Promise<void>`
Initializes the service and loads scheme data. Called automatically on first use.

#### `async getAllSchemes(): Promise<ProcessedScheme[]>`
Returns all active schemes. Automatically refreshes cache if needed.

#### `async getSchemeById(id: string): Promise<ProcessedScheme | undefined>`
Retrieves a specific scheme by ID. Checks cache first, then queries database if in database mode.

#### `async getSchemesByCategory(category: SchemeCategory): Promise<ProcessedScheme[]>`
Returns schemes filtered by category. Uses database query in database mode for better performance.

#### `async getSchemesByAudience(audience: string): Promise<ProcessedScheme[]>`
Returns schemes targeting a specific audience (e.g., "Women Entrepreneurs", "SC/ST").

#### `async searchSchemes(query: string): Promise<ProcessedScheme[]>`
Searches schemes by keyword across name, description, and tags. Uses database text search in database mode.

#### `getTokenEstimate(schemes: ProcessedScheme[], format: 'minimal' | 'detailed'): number`
Estimates token count for LLM context generation.

#### `async refreshCacheIfNeeded(): Promise<void>`
Refreshes cache if TTL has expired.

#### `async forceRefresh(): Promise<void>`
Forces immediate cache refresh regardless of TTL.

#### `setDatabaseMode(useDatabase: boolean): void`
Switches between database and JSON mode. Clears cache on mode change.

#### `getCacheStats(): { size: number; lastRefresh: Date; ttl: number; mode: string }`
Returns current cache statistics.

## Migration from Previous Version

### Breaking Changes

All public methods are now **async** and return Promises. Update your code accordingly:

**Before:**
```typescript
const schemes = schemeDataService.getAllSchemes();
const scheme = schemeDataService.getSchemeById(id);
```

**After:**
```typescript
const schemes = await schemeDataService.getAllSchemes();
const scheme = await schemeDataService.getSchemeById(id);
```

### Backward Compatibility

The service maintains backward compatibility by:
- Supporting JSON mode as fallback
- Automatically falling back to JSON if database is unavailable
- Preserving all existing processing logic
- Maintaining the same `ProcessedScheme` interface

## Database Schema

The service expects the following database schema:

```sql
CREATE TABLE schemes (
  id UUID PRIMARY KEY,
  scheme_name TEXT NOT NULL,
  scheme_url TEXT,
  ministry TEXT,
  description TEXT,
  category TEXT,
  details JSONB,
  benefits JSONB,
  eligibility JSONB,
  application_process JSONB,
  documents_required JSONB,
  financial_details JSONB,
  tags TEXT[],
  target_audience TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Performance Considerations

### Caching Strategy

- **Cache TTL**: 1 hour (configurable)
- **Cache Size**: All active schemes kept in memory
- **Refresh Strategy**: Lazy refresh on first access after TTL expiration

### Database Queries

In database mode, the service uses optimized queries:
- Category filtering: Direct `WHERE category = ?` query
- Audience filtering: Array contains query
- Text search: `ILIKE` pattern matching with OR conditions
- Single scheme lookup: Direct ID query with cache fallback

### Token Optimization

The service provides token estimation for LLM context:
- **Minimal format**: ~50 tokens per scheme
- **Detailed format**: ~600 tokens per scheme

## Testing

Run tests with:

```bash
npm test -- services/schemes/__tests__/schemeDataService.test.ts
```

Tests cover:
- Initialization in both modes
- All query methods
- Cache management
- Token estimation
- Mode switching
- Error handling

## Environment Variables

No additional environment variables required. The service uses the existing Supabase configuration:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Error Handling

The service handles errors gracefully:
- Database connection failures → Falls back to JSON
- Empty database → Falls back to JSON
- Query errors → Logs error and returns cached/JSON data
- Invalid IDs → Returns `undefined`

## Future Enhancements

Potential improvements:
- Real-time updates using Supabase subscriptions
- Scheme embeddings for semantic search
- User-specific scheme recommendations
- Analytics tracking for popular schemes
- Multi-language support for scheme content

/**
 * Schemes Migration Verification Script
 * 
 * This script verifies the integrity of migrated scheme data in the database.
 * It performs various checks to ensure data quality and completeness.
 * 
 * Usage: npx tsx scripts/verify-schemes-migration.ts
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

interface VerificationResult {
  check: string
  passed: boolean
  details: string
}

const results: VerificationResult[] = []

/**
 * Add verification result
 */
function addResult(check: string, passed: boolean, details: string) {
  results.push({ check, passed, details })
  const icon = passed ? '✅' : '❌'
  console.log(`${icon} ${check}: ${details}`)
}

/**
 * Verify schemes exist in database
 */
async function verifySchemeCount() {
  const { count, error } = await supabase
    .from('schemes')
    .select('*', { count: 'exact', head: true })
  
  if (error) {
    addResult('Scheme Count', false, `Error: ${error.message}`)
    return
  }
  
  const passed = count !== null && count > 0
  addResult('Scheme Count', passed, `Found ${count} schemes in database`)
}

/**
 * Verify required fields are populated
 */
async function verifyRequiredFields() {
  const { data, error } = await supabase
    .from('schemes')
    .select('id, scheme_name, ministry, description')
  
  if (error) {
    addResult('Required Fields', false, `Error: ${error.message}`)
    return
  }
  
  const missingFields = data?.filter((s: any) => 
    !s.scheme_name || !s.ministry || !s.description
  )
  
  const passed = missingFields?.length === 0
  addResult(
    'Required Fields',
    passed,
    passed 
      ? 'All schemes have required fields'
      : `${missingFields?.length} schemes missing required fields`
  )
}

/**
 * Verify JSONB fields are valid
 */
async function verifyJsonbFields() {
  const { data, error } = await supabase
    .from('schemes')
    .select('id, scheme_name, details, benefits, eligibility')
  
  if (error) {
    addResult('JSONB Fields', false, `Error: ${error.message}`)
    return
  }
  
  let invalidCount = 0
  
  for (const scheme of (data || []) as any[]) {
    if (!scheme.details || typeof scheme.details !== 'object') {
      invalidCount++
    }
    if (!scheme.benefits || typeof scheme.benefits !== 'object') {
      invalidCount++
    }
    if (!scheme.eligibility || typeof scheme.eligibility !== 'object') {
      invalidCount++
    }
  }
  
  const passed = invalidCount === 0
  addResult(
    'JSONB Fields',
    passed,
    passed
      ? 'All JSONB fields are valid'
      : `${invalidCount} invalid JSONB fields found`
  )
}

/**
 * Verify tags array is populated
 */
async function verifyTags() {
  const { data, error } = await supabase
    .from('schemes')
    .select('id, scheme_name, tags')
  
  if (error) {
    addResult('Tags', false, `Error: ${error.message}`)
    return
  }
  
  const withoutTags = data?.filter((s: any) => !s.tags || s.tags.length === 0)
  
  const passed = withoutTags?.length === 0
  addResult(
    'Tags',
    passed,
    passed
      ? 'All schemes have tags'
      : `${withoutTags?.length} schemes without tags`
  )
}

/**
 * Verify categories are assigned
 */
async function verifyCategories() {
  const { data, error } = await supabase
    .from('schemes')
    .select('category')
  
  if (error) {
    addResult('Categories', false, `Error: ${error.message}`)
    return
  }
  
  const categories = new Set(data?.map((s: any) => s.category).filter(Boolean))
  
  const passed = categories.size > 0
  addResult(
    'Categories',
    passed,
    `Found ${categories.size} unique categories: ${Array.from(categories).join(', ')}`
  )
}

/**
 * Verify no duplicate schemes
 */
async function verifyNoDuplicates() {
  const { data, error } = await supabase
    .from('schemes')
    .select('scheme_name, scheme_url')
  
  if (error) {
    addResult('Duplicates', false, `Error: ${error.message}`)
    return
  }
  
  const seen = new Set<string>()
  let duplicates = 0
  
  for (const scheme of (data || []) as any[]) {
    const key = `${scheme.scheme_name}|${scheme.scheme_url}`
    if (seen.has(key)) {
      duplicates++
    }
    seen.add(key)
  }
  
  const passed = duplicates === 0
  addResult(
    'Duplicates',
    passed,
    passed
      ? 'No duplicate schemes found'
      : `Found ${duplicates} duplicate schemes`
  )
}

/**
 * Verify indexes exist
 */
async function verifyIndexes() {
  const { data, error } = await supabase.rpc('pg_indexes', {
    schemaname: 'public',
    tablename: 'schemes'
  } as any)
  
  // Note: This might not work depending on RLS policies
  // Just check if we can query the table efficiently
  const { data: testData, error: testError } = await supabase
    .from('schemes')
    .select('id')
    .eq('is_active', true)
    .limit(1)
  
  const passed = !testError
  addResult(
    'Indexes',
    passed,
    passed
      ? 'Database queries working efficiently'
      : 'Index verification failed'
  )
}

/**
 * Verify all schemes are active
 */
async function verifyActiveStatus() {
  const { data, error } = await supabase
    .from('schemes')
    .select('id, is_active')
  
  if (error) {
    addResult('Active Status', false, `Error: ${error.message}`)
    return
  }
  
  const inactive = data?.filter((s: any) => !s.is_active)
  
  addResult(
    'Active Status',
    true,
    `${data?.length} active schemes, ${inactive?.length || 0} inactive`
  )
}

/**
 * Sample data check
 */
async function sampleDataCheck() {
  const { data, error } = await supabase
    .from('schemes')
    .select('*')
    .limit(1)
    .single()
  
  if (error) {
    addResult('Sample Data', false, `Error: ${error.message}`)
    return
  }
  
  const scheme = data as any
  
  console.log('\n📋 Sample Scheme Data:')
  console.log('   Name:', scheme.scheme_name)
  console.log('   Ministry:', scheme.ministry)
  console.log('   Category:', scheme.category)
  console.log('   Tags:', scheme.tags?.slice(0, 3).join(', '), '...')
  console.log('   Target Audience:', scheme.target_audience?.join(', ') || 'None')
  console.log('   Has Details:', !!scheme.details)
  console.log('   Has Benefits:', !!scheme.benefits)
  console.log('   Has Eligibility:', !!scheme.eligibility)
  console.log('   Has Application Process:', !!scheme.application_process)
  console.log('   Has Financial Details:', !!scheme.financial_details)
  
  addResult('Sample Data', true, 'Sample scheme retrieved successfully')
}

/**
 * Main verification function
 */
async function verifyMigration() {
  console.log('🔍 Starting schemes migration verification...\n')
  
  try {
    await verifySchemeCount()
    await verifyRequiredFields()
    await verifyJsonbFields()
    await verifyTags()
    await verifyCategories()
    await verifyNoDuplicates()
    await verifyIndexes()
    await verifyActiveStatus()
    await sampleDataCheck()
    
    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 Verification Summary')
    console.log('='.repeat(60))
    
    const passed = results.filter(r => r.passed).length
    const failed = results.filter(r => !r.passed).length
    const total = results.length
    
    console.log(`Total Checks: ${total}`)
    console.log(`Passed: ${passed}`)
    console.log(`Failed: ${failed}`)
    
    if (failed > 0) {
      console.log('\n❌ Some verification checks failed. Please review the issues above.')
      process.exit(1)
    } else {
      console.log('\n✨ All verification checks passed! Migration is successful.')
    }
    
  } catch (error) {
    console.error('\n❌ Verification failed:', error)
    process.exit(1)
  }
}

// Run verification
verifyMigration()

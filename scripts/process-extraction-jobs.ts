#!/usr/bin/env tsx
/**
 * Extraction Job Processor Script
 * 
 * Background service that continuously processes extraction jobs from the queue.
 * Runs as a standalone process that polls for pending jobs and processes them.
 * 
 * Usage:
 *   npm run process-jobs           # Run once
 *   npm run process-jobs:watch     # Run continuously (polling mode)
 * 
 * Environment Variables:
 *   EXTRACTION_BATCH_SIZE          - Number of jobs to process per batch (default: 10)
 *   EXTRACTION_POLL_INTERVAL       - Polling interval in seconds (default: 10)
 *   EXTRACTION_MAX_RETRIES         - Max retry attempts for failed jobs (default: 3)
 *   EXTRACTION_RETRY_DELAY         - Initial retry delay in ms (default: 1000)
 *   EXTRACTION_RETRY_BACKOFF       - Retry backoff multiplier (default: 2)
 */

import { JobQueueProcessor } from '../services/analytics/jobQueueProcessor';

// ============================================================================
// Configuration
// ============================================================================

interface ProcessorConfig {
  batchSize: number;
  pollInterval: number;
  maxRetries: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  watchMode: boolean;
}

const config: ProcessorConfig = {
  batchSize: parseInt(process.env.EXTRACTION_BATCH_SIZE || '10', 10),
  pollInterval: parseInt(process.env.EXTRACTION_POLL_INTERVAL || '10', 10),
  maxRetries: parseInt(process.env.EXTRACTION_MAX_RETRIES || '3', 10),
  retryDelayMs: parseInt(process.env.EXTRACTION_RETRY_DELAY || '1000', 10),
  retryBackoffMultiplier: parseFloat(process.env.EXTRACTION_RETRY_BACKOFF || '2'),
  watchMode: process.argv.includes('--watch') || process.argv.includes('-w'),
};

// ============================================================================
// Metrics Tracking
// ============================================================================

interface ProcessingMetrics {
  totalProcessed: number;
  totalSucceeded: number;
  totalFailed: number;
  totalSkipped: number;
  startTime: Date;
  lastProcessTime: Date | null;
  cyclesCompleted: number;
}

const metrics: ProcessingMetrics = {
  totalProcessed: 0,
  totalSucceeded: 0,
  totalFailed: 0,
  totalSkipped: 0,
  startTime: new Date(),
  lastProcessTime: null,
  cyclesCompleted: 0,
};

// ============================================================================
// Graceful Shutdown
// ============================================================================

let isShuttingDown = false;
let currentProcessor: JobQueueProcessor | null = null;

/**
 * Handle graceful shutdown
 */
function setupGracefulShutdown() {
  const shutdown = async (signal: string) => {
    if (isShuttingDown) {
      console.log('\n[Processor] Force shutdown...');
      process.exit(1);
    }

    isShuttingDown = true;
    console.log(`\n[Processor] Received ${signal}, shutting down gracefully...`);
    
    // Print final metrics
    printMetrics(true);
    
    // Wait a moment for any in-flight operations
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('[Processor] Shutdown complete');
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGHUP', () => shutdown('SIGHUP'));
}

// ============================================================================
// Metrics Logging
// ============================================================================

/**
 * Print processing metrics
 */
function printMetrics(isFinal: boolean = false) {
  const uptime = Date.now() - metrics.startTime.getTime();
  const uptimeSeconds = Math.floor(uptime / 1000);
  const uptimeMinutes = Math.floor(uptimeSeconds / 60);
  const uptimeHours = Math.floor(uptimeMinutes / 60);

  const uptimeStr = uptimeHours > 0
    ? `${uptimeHours}h ${uptimeMinutes % 60}m ${uptimeSeconds % 60}s`
    : uptimeMinutes > 0
    ? `${uptimeMinutes}m ${uptimeSeconds % 60}s`
    : `${uptimeSeconds}s`;

  const successRate = metrics.totalProcessed > 0
    ? ((metrics.totalSucceeded / metrics.totalProcessed) * 100).toFixed(1)
    : '0.0';

  const avgProcessingTime = metrics.cyclesCompleted > 0
    ? (uptime / metrics.cyclesCompleted / 1000).toFixed(2)
    : '0.00';

  console.log('\n' + '='.repeat(70));
  console.log(isFinal ? 'FINAL METRICS' : 'PROCESSING METRICS');
  console.log('='.repeat(70));
  console.log(`Uptime:           ${uptimeStr}`);
  console.log(`Cycles Completed: ${metrics.cyclesCompleted}`);
  console.log(`Total Processed:  ${metrics.totalProcessed}`);
  console.log(`  ✓ Succeeded:    ${metrics.totalSucceeded}`);
  console.log(`  ✗ Failed:       ${metrics.totalFailed}`);
  console.log(`  ⊘ Skipped:      ${metrics.totalSkipped}`);
  console.log(`Success Rate:     ${successRate}%`);
  console.log(`Avg Cycle Time:   ${avgProcessingTime}s`);
  if (metrics.lastProcessTime) {
    console.log(`Last Processed:   ${metrics.lastProcessTime.toLocaleString()}`);
  }
  console.log('='.repeat(70) + '\n');
}

/**
 * Print queue statistics
 */
async function printQueueStats(processor: JobQueueProcessor) {
  try {
    const stats = await processor.getQueueStats();
    console.log('\n' + '-'.repeat(70));
    console.log('QUEUE STATISTICS');
    console.log('-'.repeat(70));
    console.log(`Pending:     ${stats.pending}`);
    console.log(`Processing:  ${stats.processing}`);
    console.log(`Completed:   ${stats.completed}`);
    console.log(`Failed:      ${stats.failed}`);
    console.log(`Total:       ${stats.total}`);
    console.log('-'.repeat(70) + '\n');
  } catch (error) {
    console.error('[Processor] Failed to fetch queue stats:', error);
  }
}

// ============================================================================
// Job Processing
// ============================================================================

/**
 * Process a single batch of jobs
 */
async function processBatch(processor: JobQueueProcessor): Promise<void> {
  const cycleStart = Date.now();
  
  console.log(`[Processor] Starting batch processing (limit: ${config.batchSize})...`);
  
  try {
    const result = await processor.processExtractionQueue(config.batchSize);
    
    // Update metrics
    metrics.totalProcessed += result.processed;
    metrics.totalSucceeded += result.succeeded;
    metrics.totalFailed += result.failed;
    metrics.totalSkipped += result.skipped;
    metrics.lastProcessTime = new Date();
    metrics.cyclesCompleted++;
    
    const cycleTime = ((Date.now() - cycleStart) / 1000).toFixed(2);
    
    console.log(
      `[Processor] Batch complete in ${cycleTime}s: ` +
      `${result.processed} processed (${result.succeeded} succeeded, ${result.failed} failed, ${result.skipped} skipped)`
    );
    
    // Print metrics every 10 cycles or if jobs were processed
    if (metrics.cyclesCompleted % 10 === 0 || result.processed > 0) {
      printMetrics();
    }
  } catch (error) {
    console.error('[Processor] Batch processing error:', error);
    metrics.cyclesCompleted++;
  }
}

/**
 * Run processor in watch mode (continuous polling)
 */
async function runWatchMode(processor: JobQueueProcessor): Promise<void> {
  console.log('\n' + '='.repeat(70));
  console.log('EXTRACTION JOB PROCESSOR - WATCH MODE');
  console.log('='.repeat(70));
  console.log(`Batch Size:       ${config.batchSize}`);
  console.log(`Poll Interval:    ${config.pollInterval}s`);
  console.log(`Max Retries:      ${config.maxRetries}`);
  console.log(`Retry Delay:      ${config.retryDelayMs}ms`);
  console.log(`Retry Backoff:    ${config.retryBackoffMultiplier}x`);
  console.log('='.repeat(70));
  console.log('\nPress Ctrl+C to stop\n');

  // Print initial queue stats
  await printQueueStats(processor);

  // Main processing loop
  while (!isShuttingDown) {
    await processBatch(processor);
    
    // Wait for next poll interval
    if (!isShuttingDown) {
      await new Promise(resolve => setTimeout(resolve, config.pollInterval * 1000));
    }
  }
}

/**
 * Run processor once (single batch)
 */
async function runOnce(processor: JobQueueProcessor): Promise<void> {
  console.log('\n' + '='.repeat(70));
  console.log('EXTRACTION JOB PROCESSOR - SINGLE RUN');
  console.log('='.repeat(70));
  console.log(`Batch Size:       ${config.batchSize}`);
  console.log(`Max Retries:      ${config.maxRetries}`);
  console.log('='.repeat(70) + '\n');

  // Print queue stats before processing
  await printQueueStats(processor);

  // Process one batch
  await processBatch(processor);

  // Print queue stats after processing
  await printQueueStats(processor);

  // Print final metrics
  printMetrics(true);
}

// ============================================================================
// Main Entry Point
// ============================================================================

async function main() {
  try {
    // Setup graceful shutdown handlers
    setupGracefulShutdown();

    // Create processor instance
    currentProcessor = new JobQueueProcessor({
      batchSize: config.batchSize,
      maxRetries: config.maxRetries,
      retryDelayMs: config.retryDelayMs,
      retryBackoffMultiplier: config.retryBackoffMultiplier,
    });

    // Run in appropriate mode
    if (config.watchMode) {
      await runWatchMode(currentProcessor);
    } else {
      await runOnce(currentProcessor);
    }
  } catch (error) {
    console.error('[Processor] Fatal error:', error);
    process.exit(1);
  }
}

// Run the processor
main().catch(error => {
  console.error('[Processor] Unhandled error:', error);
  process.exit(1);
});

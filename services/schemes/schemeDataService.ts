import {
  SchemeData,
  SchemesDatabase,
  ProcessedScheme,
  SchemeCategory,
  SchemeCache,
  FinancialDetails
} from '@/types/scheme';
import { Scheme } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import schemesRawData from '@/data/schemes.json';

/**
 * Service for loading, processing, and managing scheme data
 * Optimized for LLM context generation and token efficiency
 * 
 * Now supports both database and JSON fallback for backward compatibility
 */
export class SchemeDataService {
  private cache: SchemeCache = {
    processed: new Map(),
    lastRefresh: new Date(),
    ttl: 3600 // 1 hour cache
  };

  private rawData: SchemesDatabase = schemesRawData as SchemesDatabase;
  private supabase = createClient();
  private useDatabase: boolean = true; // Feature flag for database vs JSON
  private isInitialized: boolean = false;

  constructor(useDatabase: boolean = true) {
    this.useDatabase = useDatabase;
  }

  /**
   * Initialize cache - async version for database support
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    if (this.useDatabase) {
      await this.initializeCacheFromDatabase();
    } else {
      this.initializeCacheFromJSON();
    }
    
    this.isInitialized = true;
  }

  /**
   * Initialize cache from database
   */
  private async initializeCacheFromDatabase(): Promise<void> {
    try {
      const { data: schemes, error } = await this.supabase
        .from('schemes')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('Error loading schemes from database:', error);
        // Fallback to JSON
        this.initializeCacheFromJSON();
        return;
      }

      if (schemes && schemes.length > 0) {
        const processed = schemes.map((scheme, index) => 
          this.processSchemeFromDatabase(scheme, index)
        );
        processed.forEach(scheme => {
          this.cache.processed.set(scheme.id, scheme);
        });
      } else {
        // No schemes in database, fallback to JSON
        this.initializeCacheFromJSON();
      }
    } catch (error) {
      console.error('Failed to initialize from database:', error);
      // Fallback to JSON
      this.initializeCacheFromJSON();
    }
  }

  /**
   * Initialize cache from JSON (backward compatibility)
   */
  private initializeCacheFromJSON(): void {
    const schemes = this.processRawSchemes(this.rawData.schemes);
    schemes.forEach(scheme => {
      this.cache.processed.set(scheme.id, scheme);
    });
  }

  /**
   * Process scheme from database format
   */
  private processSchemeFromDatabase(dbScheme: Scheme, index: number): ProcessedScheme {
    // Convert database scheme to SchemeData format for processing
    const schemeData: SchemeData = {
      scheme_name: dbScheme.scheme_name,
      scheme_url: dbScheme.scheme_url || '',
      ministry: dbScheme.ministry || '',
      description: dbScheme.description || '',
      tags: dbScheme.tags || [],
      details: typeof dbScheme.details === 'string' ? dbScheme.details : JSON.stringify(dbScheme.details || ''),
      benefits: typeof dbScheme.benefits === 'string' ? dbScheme.benefits : JSON.stringify(dbScheme.benefits || ''),
      eligibility: typeof dbScheme.eligibility === 'string' ? dbScheme.eligibility : JSON.stringify(dbScheme.eligibility || ''),
      application_process: typeof dbScheme.application_process === 'object' && dbScheme.application_process !== null
        ? dbScheme.application_process as any
        : { content: JSON.stringify(dbScheme.application_process || ''), has_tabs: false },
      documents_required: typeof dbScheme.documents_required === 'string' 
        ? dbScheme.documents_required 
        : JSON.stringify(dbScheme.documents_required || ''),
      faqs: null,
      sources: []
    };

    // Use existing processing logic
    const processed = this.processScheme(schemeData, index);
    
    // Override ID with database ID
    processed.id = dbScheme.id;
    
    // Use database category if available
    if (dbScheme.category) {
      processed.category = dbScheme.category as SchemeCategory;
    }
    
    // Use database target audience if available
    if (dbScheme.target_audience && dbScheme.target_audience.length > 0) {
      processed.targetAudience = dbScheme.target_audience;
    }
    
    // Use database financial details if available
    if (dbScheme.financial_details) {
      processed.financialDetails = dbScheme.financial_details as FinancialDetails;
    }
    
    return processed;
  }

  /**
   * Process raw scheme data into optimized format
   */
  private processRawSchemes(rawSchemes: SchemeData[]): ProcessedScheme[] {
    return rawSchemes.map((scheme, index) => this.processScheme(scheme, index));
  }

  /**
   * Process individual scheme with NLP and structuring
   */
  private processScheme(scheme: SchemeData, index: number): ProcessedScheme {
    const id = this.generateSchemeId(scheme.scheme_name, index);
    const category = this.categorizeScheme(scheme.tags);
    const targetAudience = this.extractTargetAudience(scheme);
    const keyBenefits = this.extractKeyBenefits(scheme.benefits);
    const eligibilityCriteria = this.extractEligibilityCriteria(scheme.eligibility);
    const financialDetails = this.extractFinancialDetails(scheme.details);
    const applicationSteps = this.extractApplicationSteps(scheme.application_process);

    return {
      id,
      name: scheme.scheme_name,
      shortName: this.generateShortName(scheme.scheme_name),
      url: scheme.scheme_url,
      ministry: scheme.ministry,
      summary: this.generateSummary(scheme.description),
      fullDescription: scheme.description,
      category,
      tags: scheme.tags,
      targetAudience,
      keyBenefits,
      eligibilityCriteria,
      financialDetails,
      applicationSteps,
      documentsNeeded: this.extractDocuments(scheme),
      onlineApplication: scheme.application_process.content.includes('Online'),
      applicationUrls: this.extractUrls(scheme),
      minimalContext: this.generateMinimalContext(scheme),
      detailedContext: this.generateDetailedContext(scheme),
      relevanceScore: 0,
      popularityRank: index + 1
    };
  }

  /**
   * Generate unique scheme ID
   */
  private generateSchemeId(name: string, index: number): string {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return `${slug}-${index}`;
  }

  /**
   * Generate short name/acronym
   */
  private generateShortName(name: string): string {
    // Extract common acronyms
    if (name.includes("PMEGP")) return "PMEGP";
    if (name.includes("CGTMSE")) return "CGTMSE";
    if (name.includes("CLCSS")) return "CLCSS";

    // Generate from capitals
    const acronym = name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();

    return acronym.length <= 6 ? acronym : name.substring(0, 20) + '...';
  }

  /**
   * Categorize scheme based on tags
   */
  private categorizeScheme(tags: string[]): SchemeCategory {
    const tagString = tags.join(' ').toLowerCase();

    if (tagString.includes('loan') || tagString.includes('credit')) {
      return SchemeCategory.LOAN;
    }
    if (tagString.includes('subsidy') || tagString.includes('margin money')) {
      return SchemeCategory.SUBSIDY;
    }
    if (tagString.includes('training') || tagString.includes('skill')) {
      return SchemeCategory.TRAINING;
    }
    if (tagString.includes('grant')) {
      return SchemeCategory.GRANT;
    }
    if (tagString.includes('technology') || tagString.includes('upgradation')) {
      return SchemeCategory.TECHNOLOGY;
    }
    if (tagString.includes('marketing')) {
      return SchemeCategory.MARKETING;
    }
    if (tagString.includes('certification') || tagString.includes('quality')) {
      return SchemeCategory.CERTIFICATION;
    }

    return SchemeCategory.MIXED;
  }

  /**
   * Extract target audience from scheme data
   */
  private extractTargetAudience(scheme: SchemeData): string[] {
    const audience: string[] = [];
    const text = (scheme.benefits + ' ' + scheme.eligibility + ' ' + scheme.tags.join(' ')).toLowerCase();

    if (text.includes('women')) audience.push('Women Entrepreneurs');
    if (text.includes('sc') || text.includes('st') || text.includes('scheduled')) audience.push('SC/ST');
    if (text.includes('obc')) audience.push('OBC');
    if (text.includes('minority')) audience.push('Minorities');
    if (text.includes('rural')) audience.push('Rural Enterprises');
    if (text.includes('urban')) audience.push('Urban Enterprises');
    if (text.includes('new enterprise') || text.includes('startup')) audience.push('New Entrepreneurs');
    if (text.includes('existing')) audience.push('Existing Businesses');
    if (text.includes('micro')) audience.push('Micro Enterprises');
    if (text.includes('small')) audience.push('Small Enterprises');
    if (text.includes('medium')) audience.push('Medium Enterprises');

    return audience.length > 0 ? audience : ['All MSMEs'];
  }

  /**
   * Extract key benefits (bullet points)
   */
  private extractKeyBenefits(benefitsText: string): string[] {
    if (!benefitsText) return [];

    const benefits: string[] = [];

    // Split by newlines and common delimiters
    const lines = benefitsText
      .split(/[\n\r]+/)
      .map(line => line.trim())
      .filter(line => line.length > 10);

    // Extract key points
    lines.forEach(line => {
      // Look for numbered points
      if (/^\d+[\.\)]\s/.test(line)) {
        benefits.push(line.replace(/^\d+[\.\)]\s/, '').trim());
      }
      // Look for bullet points
      else if (/^[•\-\*]\s/.test(line)) {
        benefits.push(line.replace(/^[•\-\*]\s/, '').trim());
      }
      // Key sentences with benefit keywords
      else if (line.match(/subsidy|loan|grant|assistance|support|training|benefit/i)) {
        if (line.length < 200) benefits.push(line);
      }
    });

    // If no structured benefits found, extract first 3 sentences
    if (benefits.length === 0) {
      const sentences = benefitsText.match(/[^.!?]+[.!?]/g) || [];
      benefits.push(...sentences.slice(0, 3).map(s => s.trim()));
    }

    return benefits.slice(0, 5); // Limit to 5 key benefits
  }

  /**
   * Extract eligibility criteria
   */
  private extractEligibilityCriteria(eligibilityText: string): string[] {
    if (!eligibilityText) return [];

    const criteria: string[] = [];
    const lines = eligibilityText
      .split(/[\n\r]+/)
      .map(line => line.trim())
      .filter(line => line.length > 10);

    lines.forEach(line => {
      // Skip negative list headers
      if (line.toLowerCase().includes('negative list') ||
          line.toLowerCase().includes('not eligible')) {
        return;
      }

      // Extract criteria
      if (/^\d+[\.\)]\s/.test(line) || /^[•\-\*]\s/.test(line)) {
        criteria.push(line.replace(/^[\d•\-\*][\.\)]\s*/, '').trim());
      } else if (line.includes('years') || line.includes('age') ||
                 line.includes('must') || line.includes('should') ||
                 line.includes('eligible') || line.includes('required')) {
        if (line.length < 200) criteria.push(line);
      }
    });

    return criteria.slice(0, 5);
  }

  /**
   * Extract financial details
   */
  private extractFinancialDetails(detailsText: string): FinancialDetails | undefined {
    if (!detailsText) return undefined;

    const financial: FinancialDetails = {};

    // Extract loan amounts
    const loanMatches = detailsText.match(/₹[\s]*(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:lakh|crore|thousand)?/gi);
    if (loanMatches) {
      const amounts = loanMatches.map(match => this.parseAmount(match));
      if (amounts.length > 0) {
        financial.loanAmount = {
          min: Math.min(...amounts),
          max: Math.max(...amounts)
        };
      }
    }

    // Extract subsidy percentages
    const subsidyMatches = detailsText.match(/(\d+(?:\.\d+)?)\s*%\s*(?:subsidy|margin money)?/gi);
    if (subsidyMatches) {
      const percentages = subsidyMatches.map(match => parseFloat(match.replace(/[^\d.]/g, '')));

      // Look for urban/rural distinction
      if (detailsText.includes('Urban') && detailsText.includes('Rural')) {
        const urbanMatch = detailsText.match(/urban[^.]*?(\d+(?:\.\d+)?)\s*%/i);
        const ruralMatch = detailsText.match(/rural[^.]*?(\d+(?:\.\d+)?)\s*%/i);

        if (urbanMatch && ruralMatch) {
          financial.subsidyPercentage = {
            urban: parseFloat(urbanMatch[1]),
            rural: parseFloat(ruralMatch[1])
          };
        }
      } else if (percentages.length > 0) {
        financial.subsidyPercentage = {
          urban: percentages[0],
          rural: percentages[0]
        };
      }
    }

    // Check for collateral
    if (detailsText.toLowerCase().includes('collateral free') ||
        detailsText.toLowerCase().includes('no collateral')) {
      financial.collateralRequired = false;
    }

    return Object.keys(financial).length > 0 ? financial : undefined;
  }

  /**
   * Parse amount strings to numbers
   */
  private parseAmount(amountStr: string): number {
    const cleanStr = amountStr.replace(/[₹,\s]/g, '');
    const match = cleanStr.match(/(\d+(?:\.\d+)?)\s*(lakh|crore|thousand)?/i);

    if (!match) return 0;

    let amount = parseFloat(match[1]);
    const unit = match[2]?.toLowerCase();

    if (unit === 'thousand') amount *= 1000;
    else if (unit === 'lakh') amount *= 100000;
    else if (unit === 'crore') amount *= 10000000;

    return amount;
  }

  /**
   * Extract application steps
   */
  private extractApplicationSteps(appProcess: { content: string; has_tabs: boolean }): string[] {
    const steps: string[] = [];
    const content = appProcess.content;

    // Extract numbered steps
    const numberedSteps = content.match(/\d+\.\s*[^\n]+/g) || [];
    steps.push(...numberedSteps.map(step => step.replace(/^\d+\.\s*/, '').trim()));

    // Extract key action items
    if (steps.length === 0) {
      const lines = content.split('\n').filter(line =>
        line.includes('Visit') || line.includes('Click') ||
        line.includes('Apply') || line.includes('Submit') ||
        line.includes('Fill') || line.includes('Upload')
      );
      steps.push(...lines.slice(0, 5));
    }

    return steps;
  }

  /**
   * Extract documents needed
   */
  private extractDocuments(scheme: SchemeData): string[] {
    const docs: string[] = [];
    const text = (scheme.documents_required || '') + ' ' + scheme.application_process.content;

    // Common documents
    const commonDocs = [
      'Aadhaar', 'PAN', 'GST', 'Bank Statement', 'Project Report',
      'Address Proof', 'Identity Proof', 'Caste Certificate',
      'Income Certificate', 'Educational Certificate'
    ];

    commonDocs.forEach(doc => {
      if (text.toLowerCase().includes(doc.toLowerCase())) {
        docs.push(doc);
      }
    });

    return docs;
  }

  /**
   * Extract URLs from scheme
   */
  private extractUrls(scheme: SchemeData): string[] {
    const urls: string[] = [scheme.scheme_url];

    // Extract URLs from application process
    const urlMatches = scheme.application_process.content.match(/https?:\/\/[^\s]+/g) || [];
    urls.push(...urlMatches);

    // Add source URLs
    scheme.sources.forEach(source => {
      if (source.url) urls.push(source.url);
    });

    return [...new Set(urls)]; // Remove duplicates
  }

  /**
   * Generate minimal context for token optimization
   * ~100-150 tokens per scheme
   */
  private generateMinimalContext(scheme: SchemeData): string {
    const name = scheme.scheme_name;
    const category = this.categorizeScheme(scheme.tags);
    const keyBenefit = scheme.benefits.split('.')[0];
    const mainEligibility = scheme.eligibility.split('.')[0];

    return `${name} (${category}): ${keyBenefit}. Eligibility: ${mainEligibility}`;
  }

  /**
   * Generate detailed context for specific queries
   * ~500-800 tokens per scheme
   */
  private generateDetailedContext(scheme: SchemeData): string {
    const benefits = this.extractKeyBenefits(scheme.benefits).slice(0, 3).join('; ');
    const eligibility = this.extractEligibilityCriteria(scheme.eligibility).slice(0, 3).join('; ');
    const financial = this.extractFinancialDetails(scheme.details);

    let context = `Scheme: ${scheme.scheme_name}\n`;
    context += `Ministry: ${scheme.ministry}\n`;
    context += `Category: ${this.categorizeScheme(scheme.tags)}\n`;
    context += `Benefits: ${benefits}\n`;
    context += `Eligibility: ${eligibility}\n`;

    if (financial?.loanAmount) {
      context += `Loan Amount: ₹${financial.loanAmount.min} - ₹${financial.loanAmount.max}\n`;
    }
    if (financial?.subsidyPercentage) {
      context += `Subsidy: Urban ${financial.subsidyPercentage.urban}%, Rural ${financial.subsidyPercentage.rural}%\n`;
    }

    context += `Apply: ${scheme.scheme_url}`;

    return context;
  }

  /**
   * Generate summary from description
   */
  private generateSummary(description: string): string {
    // Take first 150 characters or first sentence
    const firstSentence = description.match(/^[^.!?]+[.!?]/)?.[0] || description;
    return firstSentence.length > 150
      ? firstSentence.substring(0, 147) + '...'
      : firstSentence;
  }

  // Public methods

  /**
   * Get all processed schemes
   */
  async getAllSchemes(): Promise<ProcessedScheme[]> {
    await this.initialize();
    
    // If using database, fetch fresh data with cache check
    if (this.useDatabase) {
      await this.refreshCacheIfNeeded();
    }
    
    return Array.from(this.cache.processed.values());
  }

  /**
   * Get scheme by ID
   */
  async getSchemeById(id: string): Promise<ProcessedScheme | undefined> {
    await this.initialize();
    
    // Try cache first
    const cached = this.cache.processed.get(id);
    if (cached) return cached;
    
    // If using database and not in cache, try fetching directly
    if (this.useDatabase) {
      try {
        const { data: scheme, error } = await this.supabase
          .from('schemes')
          .select('*')
          .eq('id', id)
          .eq('is_active', true)
          .single();
        
        if (!error && scheme) {
          const processed = this.processSchemeFromDatabase(scheme, 0);
          this.cache.processed.set(processed.id, processed);
          return processed;
        }
      } catch (error) {
        console.error('Error fetching scheme by ID:', error);
      }
    }
    
    return undefined;
  }

  /**
   * Get schemes by category
   */
  async getSchemesByCategory(category: SchemeCategory): Promise<ProcessedScheme[]> {
    await this.initialize();
    
    // If using database, query directly for better performance
    if (this.useDatabase) {
      try {
        const { data: schemes, error } = await this.supabase
          .from('schemes')
          .select('*')
          .eq('category', category)
          .eq('is_active', true);
        
        if (!error && schemes) {
          return schemes.map((scheme, index) => 
            this.processSchemeFromDatabase(scheme, index)
          );
        }
      } catch (error) {
        console.error('Error fetching schemes by category:', error);
      }
    }
    
    // Fallback to cache
    const allSchemes = await this.getAllSchemes();
    return allSchemes.filter(scheme => scheme.category === category);
  }

  /**
   * Get schemes by target audience
   */
  async getSchemesByAudience(audience: string): Promise<ProcessedScheme[]> {
    await this.initialize();
    
    // If using database, use array contains query
    if (this.useDatabase) {
      try {
        const { data: schemes, error } = await this.supabase
          .from('schemes')
          .select('*')
          .contains('target_audience', [audience])
          .eq('is_active', true);
        
        if (!error && schemes) {
          return schemes.map((scheme, index) => 
            this.processSchemeFromDatabase(scheme, index)
          );
        }
      } catch (error) {
        console.error('Error fetching schemes by audience:', error);
      }
    }
    
    // Fallback to cache with filter
    const allSchemes = await this.getAllSchemes();
    return allSchemes.filter(scheme =>
      scheme.targetAudience.some(a => a.toLowerCase().includes(audience.toLowerCase()))
    );
  }

  /**
   * Search schemes by keyword
   */
  async searchSchemes(query: string): Promise<ProcessedScheme[]> {
    await this.initialize();
    
    const queryLower = query.toLowerCase();
    
    // If using database, use text search
    if (this.useDatabase) {
      try {
        const { data: schemes, error } = await this.supabase
          .from('schemes')
          .select('*')
          .or(`scheme_name.ilike.%${queryLower}%,description.ilike.%${queryLower}%,tags.cs.{${queryLower}}`)
          .eq('is_active', true);
        
        if (!error && schemes) {
          return schemes.map((scheme, index) => 
            this.processSchemeFromDatabase(scheme, index)
          );
        }
      } catch (error) {
        console.error('Error searching schemes:', error);
      }
    }
    
    // Fallback to cache with filter
    const allSchemes = await this.getAllSchemes();
    return allSchemes.filter(scheme =>
      scheme.name.toLowerCase().includes(queryLower) ||
      scheme.summary.toLowerCase().includes(queryLower) ||
      scheme.tags.some(tag => tag.toLowerCase().includes(queryLower)) ||
      scheme.keyBenefits.some(benefit => benefit.toLowerCase().includes(queryLower))
    );
  }

  /**
   * Get total token estimate for schemes
   */
  getTokenEstimate(schemes: ProcessedScheme[], format: 'minimal' | 'detailed' = 'minimal'): number {
    // Rough estimation: 1 token ≈ 4 characters
    const totalChars = schemes.reduce((sum, scheme) => {
      const text = format === 'minimal' ? scheme.minimalContext : scheme.detailedContext;
      return sum + (text?.length || 0);
    }, 0);

    return Math.ceil(totalChars / 4);
  }

  /**
   * Refresh cache if needed
   */
  async refreshCacheIfNeeded(): Promise<void> {
    const now = new Date();
    const timeSinceRefresh = (now.getTime() - this.cache.lastRefresh.getTime()) / 1000;

    if (timeSinceRefresh > this.cache.ttl) {
      if (this.useDatabase) {
        await this.initializeCacheFromDatabase();
      } else {
        this.initializeCacheFromJSON();
      }
      this.cache.lastRefresh = now;
    }
  }

  /**
   * Force refresh cache from database
   */
  async forceRefresh(): Promise<void> {
    this.cache.processed.clear();
    this.isInitialized = false;
    await this.initialize();
  }

  /**
   * Switch between database and JSON mode
   */
  setDatabaseMode(useDatabase: boolean): void {
    if (this.useDatabase !== useDatabase) {
      this.useDatabase = useDatabase;
      this.cache.processed.clear();
      this.isInitialized = false;
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; lastRefresh: Date; ttl: number; mode: string } {
    return {
      size: this.cache.processed.size,
      lastRefresh: this.cache.lastRefresh,
      ttl: this.cache.ttl,
      mode: this.useDatabase ? 'database' : 'json'
    };
  }
}

// Export singleton instance (defaults to database mode)
export const schemeDataService = new SchemeDataService(true);

// Export class for custom instances
export default SchemeDataService;
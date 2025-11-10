import {
  SchemeData,
  SchemesDatabase,
  ProcessedScheme,
  SchemeCategory,
  SchemeCache,
  FinancialDetails
} from '@/types/scheme';
import schemesRawData from '@/data/schemes.json';

/**
 * Service for loading, processing, and managing scheme data
 * Optimized for LLM context generation and token efficiency
 */
export class SchemeDataService {
  private cache: SchemeCache = {
    processed: new Map(),
    lastRefresh: new Date(),
    ttl: 3600 // 1 hour cache
  };

  private rawData: SchemesDatabase = schemesRawData as SchemesDatabase;

  constructor() {
    this.initializeCache();
  }

  /**
   * Initialize cache with processed schemes
   */
  private initializeCache(): void {
    const schemes = this.processRawSchemes(this.rawData.schemes);
    schemes.forEach(scheme => {
      this.cache.processed.set(scheme.id, scheme);
    });
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
  getAllSchemes(): ProcessedScheme[] {
    return Array.from(this.cache.processed.values());
  }

  /**
   * Get scheme by ID
   */
  getSchemeById(id: string): ProcessedScheme | undefined {
    return this.cache.processed.get(id);
  }

  /**
   * Get schemes by category
   */
  getSchemesByCategory(category: SchemeCategory): ProcessedScheme[] {
    return this.getAllSchemes().filter(scheme => scheme.category === category);
  }

  /**
   * Get schemes by target audience
   */
  getSchemesByAudience(audience: string): ProcessedScheme[] {
    return this.getAllSchemes().filter(scheme =>
      scheme.targetAudience.some(a => a.toLowerCase().includes(audience.toLowerCase()))
    );
  }

  /**
   * Search schemes by keyword
   */
  searchSchemes(query: string): ProcessedScheme[] {
    const queryLower = query.toLowerCase();
    return this.getAllSchemes().filter(scheme =>
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
  refreshCacheIfNeeded(): void {
    const now = new Date();
    const timeSinceRefresh = (now.getTime() - this.cache.lastRefresh.getTime()) / 1000;

    if (timeSinceRefresh > this.cache.ttl) {
      this.initializeCache();
      this.cache.lastRefresh = now;
    }
  }
}

// Export singleton instance
export const schemeDataService = new SchemeDataService();
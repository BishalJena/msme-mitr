import {
  ProcessedScheme,
  SchemeFilter,
  SchemeSearchResult,
  UserProfile,
  SchemeCategory
} from '@/types/scheme';

/**
 * Utility functions for scheme filtering, searching, and ranking
 */

/**
 * Filter schemes based on multiple criteria
 */
export function filterSchemes(
  schemes: ProcessedScheme[],
  filter: SchemeFilter
): ProcessedScheme[] {
  let filtered = [...schemes];

  // Filter by categories
  if (filter.categories && filter.categories.length > 0) {
    filtered = filtered.filter(scheme =>
      filter.categories!.includes(scheme.category)
    );
  }

  // Filter by tags
  if (filter.tags && filter.tags.length > 0) {
    filtered = filtered.filter(scheme =>
      filter.tags!.some(tag =>
        scheme.tags.some(schemeTag =>
          schemeTag.toLowerCase().includes(tag.toLowerCase())
        )
      )
    );
  }

  // Filter by target audience
  if (filter.targetAudience && filter.targetAudience.length > 0) {
    filtered = filtered.filter(scheme =>
      filter.targetAudience!.some(audience =>
        scheme.targetAudience.some(schemeAudience =>
          schemeAudience.toLowerCase().includes(audience.toLowerCase())
        )
      )
    );
  }

  // Filter by ministry
  if (filter.ministry) {
    filtered = filtered.filter(scheme =>
      scheme.ministry.toLowerCase().includes(filter.ministry!.toLowerCase())
    );
  }

  // Filter by online application availability
  if (filter.hasOnlineApplication !== undefined) {
    filtered = filtered.filter(scheme =>
      scheme.onlineApplication === filter.hasOnlineApplication
    );
  }

  // Apply search query
  if (filter.searchQuery) {
    filtered = searchInSchemes(filtered, filter.searchQuery);
  }

  // Limit results
  if (filter.maxResults) {
    filtered = filtered.slice(0, filter.maxResults);
  }

  return filtered;
}

/**
 * Search schemes using fuzzy matching
 */
export function searchInSchemes(
  schemes: ProcessedScheme[],
  query: string
): ProcessedScheme[] {
  const queryLower = query.toLowerCase();
  const queryTokens = tokenize(queryLower);

  const results: SchemeSearchResult[] = schemes.map(scheme => {
    const result: SchemeSearchResult = {
      scheme,
      score: 0,
      matchedFields: []
    };

    // Score name matches (highest weight)
    if (scheme.name.toLowerCase().includes(queryLower)) {
      result.score += 10;
      result.matchedFields.push('name');
    } else {
      const nameScore = calculateTokenMatchScore(
        tokenize(scheme.name.toLowerCase()),
        queryTokens
      );
      result.score += nameScore * 5;
      if (nameScore > 0) result.matchedFields.push('name');
    }

    // Score summary matches
    if (scheme.summary.toLowerCase().includes(queryLower)) {
      result.score += 5;
      result.matchedFields.push('summary');
    }

    // Score tag matches
    const tagMatch = scheme.tags.some(tag =>
      tag.toLowerCase().includes(queryLower)
    );
    if (tagMatch) {
      result.score += 7;
      result.matchedFields.push('tags');
    }

    // Score benefit matches
    const benefitMatch = scheme.keyBenefits.some(benefit =>
      benefit.toLowerCase().includes(queryLower)
    );
    if (benefitMatch) {
      result.score += 4;
      result.matchedFields.push('benefits');
    }

    // Score eligibility matches
    const eligibilityMatch = scheme.eligibilityCriteria.some(criteria =>
      criteria.toLowerCase().includes(queryLower)
    );
    if (eligibilityMatch) {
      result.score += 3;
      result.matchedFields.push('eligibility');
    }

    // Score target audience matches
    const audienceMatch = scheme.targetAudience.some(audience =>
      audience.toLowerCase().includes(queryLower)
    );
    if (audienceMatch) {
      result.score += 6;
      result.matchedFields.push('targetAudience');
    }

    return result;
  });

  // Filter and sort by score
  return results
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(r => r.scheme);
}

/**
 * Get schemes relevant to user profile
 */
export function getSchemesForProfile(
  schemes: ProcessedScheme[],
  profile: UserProfile
): ProcessedScheme[] {
  const scored = schemes.map(scheme => ({
    scheme,
    score: calculateProfileRelevanceScore(scheme, profile)
  }));

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(s => s.scheme);
}

/**
 * Calculate relevance score based on user profile
 */
export function calculateProfileRelevanceScore(
  scheme: ProcessedScheme,
  profile: UserProfile
): number {
  let score = 0;

  // Location match
  if (profile.location) {
    if (profile.location.isRural && scheme.targetAudience.includes('Rural Enterprises')) {
      score += 3;
    }
    if (!profile.location.isRural && scheme.targetAudience.includes('Urban Enterprises')) {
      score += 2;
    }
  }

  // Category match (SC/ST/OBC/Women)
  if (profile.category) {
    if (scheme.targetAudience.some(a => a.includes(profile.category!))) {
      score += 5; // High priority for category-specific schemes
    }
  }

  // Gender match
  if (profile.gender === 'female' &&
      scheme.targetAudience.includes('Women Entrepreneurs')) {
    score += 5;
  }

  // Business stage match
  if (profile.businessStage) {
    if (profile.businessStage === 'new' &&
        scheme.targetAudience.includes('New Entrepreneurs')) {
      score += 4;
    }
    if (profile.businessStage === 'existing' &&
        scheme.targetAudience.includes('Existing Businesses')) {
      score += 4;
    }
  }

  // Interest match
  if (profile.interests) {
    const interestMatch = profile.interests.some(interest =>
      scheme.tags.some(tag =>
        tag.toLowerCase().includes(interest.toLowerCase())
      )
    );
    if (interestMatch) score += 2;
  }

  // Business type match
  if (profile.businessType) {
    const typeMatch = scheme.targetAudience.some(audience =>
      audience.toLowerCase().includes(profile.businessType!.toLowerCase())
    );
    if (typeMatch) score += 3;
  }

  return score;
}

/**
 * Get schemes by financial requirements
 */
export function getSchemesByFinancialNeed(
  schemes: ProcessedScheme[],
  minAmount: number,
  maxAmount: number
): ProcessedScheme[] {
  return schemes.filter(scheme => {
    if (!scheme.financialDetails?.loanAmount) return false;

    const schemeMin = scheme.financialDetails.loanAmount.min || 0;
    const schemeMax = scheme.financialDetails.loanAmount.max || Infinity;

    // Check if requested range overlaps with scheme range
    return (minAmount <= schemeMax && maxAmount >= schemeMin);
  });
}

/**
 * Get complementary schemes
 * (Schemes that work well together)
 */
export function getComplementarySchemes(
  primaryScheme: ProcessedScheme,
  allSchemes: ProcessedScheme[]
): ProcessedScheme[] {
  const complementary: ProcessedScheme[] = [];

  // Don't include the primary scheme
  const otherSchemes = allSchemes.filter(s => s.id !== primaryScheme.id);

  otherSchemes.forEach(scheme => {
    // If primary is loan, suggest subsidy schemes
    if (primaryScheme.category === SchemeCategory.LOAN &&
        scheme.category === SchemeCategory.SUBSIDY) {
      complementary.push(scheme);
    }

    // If primary is training, suggest certification
    if (primaryScheme.category === SchemeCategory.TRAINING &&
        scheme.category === SchemeCategory.CERTIFICATION) {
      complementary.push(scheme);
    }

    // If same target audience but different benefit type
    const sameAudience = scheme.targetAudience.some(a =>
      primaryScheme.targetAudience.includes(a)
    );
    const differentCategory = scheme.category !== primaryScheme.category;

    if (sameAudience && differentCategory) {
      complementary.push(scheme);
    }
  });

  // Return top 3 complementary schemes
  return complementary.slice(0, 3);
}

/**
 * Group schemes by category
 */
export function groupSchemesByCategory(
  schemes: ProcessedScheme[]
): Map<SchemeCategory, ProcessedScheme[]> {
  const grouped = new Map<SchemeCategory, ProcessedScheme[]>();

  schemes.forEach(scheme => {
    const category = scheme.category;
    if (!grouped.has(category)) {
      grouped.set(category, []);
    }
    grouped.get(category)!.push(scheme);
  });

  return grouped;
}

/**
 * Get scheme statistics
 */
export function getSchemeStatistics(schemes: ProcessedScheme[]) {
  const stats = {
    total: schemes.length,
    byCategory: {} as Record<string, number>,
    byMinistry: {} as Record<string, number>,
    withOnlineApplication: 0,
    withFinancialSupport: 0,
    averageMaxLoanAmount: 0
  };

  const loanAmounts: number[] = [];

  schemes.forEach(scheme => {
    // Category stats
    stats.byCategory[scheme.category] = (stats.byCategory[scheme.category] || 0) + 1;

    // Ministry stats
    const ministry = scheme.ministry.split(' ').slice(0, 3).join(' '); // Shorten ministry name
    stats.byMinistry[ministry] = (stats.byMinistry[ministry] || 0) + 1;

    // Online application stats
    if (scheme.onlineApplication) {
      stats.withOnlineApplication++;
    }

    // Financial support stats
    if (scheme.financialDetails) {
      stats.withFinancialSupport++;
      if (scheme.financialDetails.loanAmount?.max) {
        loanAmounts.push(scheme.financialDetails.loanAmount.max);
      }
    }
  });

  // Calculate average max loan amount
  if (loanAmounts.length > 0) {
    stats.averageMaxLoanAmount = loanAmounts.reduce((a, b) => a + b, 0) / loanAmounts.length;
  }

  return stats;
}

/**
 * Rank schemes by multiple factors
 */
export function rankSchemes(
  schemes: ProcessedScheme[],
  factors: {
    userProfile?: UserProfile;
    searchQuery?: string;
    preferOnline?: boolean;
    preferHighSubsidy?: boolean;
  }
): ProcessedScheme[] {
  const scored = schemes.map(scheme => {
    let score = scheme.relevanceScore || 0;

    // User profile relevance
    if (factors.userProfile) {
      score += calculateProfileRelevanceScore(scheme, factors.userProfile) * 2;
    }

    // Search relevance
    if (factors.searchQuery) {
      const searchResult = searchInSchemes([scheme], factors.searchQuery);
      if (searchResult.length > 0) {
        score += 5;
      }
    }

    // Online application preference
    if (factors.preferOnline && scheme.onlineApplication) {
      score += 3;
    }

    // High subsidy preference
    if (factors.preferHighSubsidy && scheme.financialDetails?.subsidyPercentage) {
      const maxSubsidy = Math.max(
        scheme.financialDetails.subsidyPercentage.urban || 0,
        scheme.financialDetails.subsidyPercentage.rural || 0
      );
      score += maxSubsidy / 10; // Convert percentage to score
    }

    // Popularity factor
    score += (11 - (scheme.popularityRank || 11)) * 0.5;

    return { scheme, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .map(s => s.scheme);
}

// Helper functions

/**
 * Tokenize text for fuzzy matching
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(token => token.length > 2);
}

/**
 * Calculate token match score
 */
function calculateTokenMatchScore(tokens1: string[], tokens2: string[]): number {
  let matches = 0;
  tokens2.forEach(token2 => {
    if (tokens1.some(token1 => token1.includes(token2) || token2.includes(token1))) {
      matches++;
    }
  });
  return matches / Math.max(tokens2.length, 1);
}

/**
 * Extract key information for quick reference
 */
export function extractSchemeHighlights(scheme: ProcessedScheme): string {
  const highlights: string[] = [];

  // Add scheme name
  highlights.push(`**${scheme.name}**`);

  // Add category
  highlights.push(`Category: ${scheme.category}`);

  // Add key financial info
  if (scheme.financialDetails?.loanAmount) {
    const max = scheme.financialDetails.loanAmount.max;
    if (max) {
      highlights.push(`Max Loan: ₹${formatAmount(max)}`);
    }
  }

  if (scheme.financialDetails?.subsidyPercentage) {
    const subsidy = scheme.financialDetails.subsidyPercentage;
    highlights.push(`Subsidy: ${subsidy.urban || subsidy.rural}%`);
  }

  // Add target audience
  if (scheme.targetAudience.length > 0) {
    highlights.push(`For: ${scheme.targetAudience.slice(0, 2).join(', ')}`);
  }

  return highlights.join(' | ');
}

/**
 * Format amount in Indian numbering system
 */
export function formatAmount(amount: number): string {
  if (amount >= 10000000) {
    return `${(amount / 10000000).toFixed(1)} Cr`;
  } else if (amount >= 100000) {
    return `${(amount / 100000).toFixed(1)} L`;
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}K`;
  }
  return amount.toString();
}
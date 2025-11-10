// Comprehensive TypeScript types for MSME Scheme Data

export interface SchemeSource {
  text: string;
  url: string;
}

export interface ApplicationProcess {
  content: string;
  has_tabs: boolean;
}

export interface SchemeData {
  scheme_name: string;
  scheme_url: string;
  ministry: string;
  description: string;
  tags: string[];
  details: string;
  benefits: string;
  eligibility: string;
  application_process: ApplicationProcess;
  documents_required: string | null;
  faqs: string | null;
  sources: SchemeSource[];
}

export interface SchemesDatabase {
  extraction_date: string;
  source_url: string;
  total_schemes: number;
  schemes: SchemeData[];
}

// Derived types for processing and optimization
export interface ProcessedScheme {
  id: string;
  name: string;
  shortName?: string;
  url: string;
  ministry: string;
  summary: string; // Shortened description for quick context
  fullDescription: string;
  category: SchemeCategory;
  tags: string[];
  targetAudience: string[];

  // Structured benefits and eligibility
  keyBenefits: string[];
  eligibilityCriteria: string[];
  financialDetails?: FinancialDetails;

  // Application info
  applicationSteps: string[];
  documentsNeeded: string[];
  onlineApplication: boolean;
  applicationUrls: string[];

  // Metadata for optimization
  relevanceScore?: number;
  lastUpdated?: Date;
  popularityRank?: number;

  // Token optimization fields
  minimalContext?: string; // Ultra-compressed version for token savings
  detailedContext?: string; // Full context when needed
}

export interface FinancialDetails {
  loanAmount?: {
    min?: number;
    max?: number;
  };
  subsidyPercentage?: {
    urban?: number;
    rural?: number;
  };
  interestRate?: number;
  processingFee?: number;
  collateralRequired?: boolean;
}

export enum SchemeCategory {
  LOAN = 'loan',
  SUBSIDY = 'subsidy',
  GRANT = 'grant',
  TRAINING = 'training',
  CREDIT_GUARANTEE = 'credit_guarantee',
  MARKETING = 'marketing',
  TECHNOLOGY = 'technology',
  INFRASTRUCTURE = 'infrastructure',
  CERTIFICATION = 'certification',
  MIXED = 'mixed'
}

export interface SchemeFilter {
  categories?: SchemeCategory[];
  tags?: string[];
  targetAudience?: string[];
  ministry?: string;
  hasOnlineApplication?: boolean;
  searchQuery?: string;
  maxResults?: number;
}

// Context types for LLM
export interface SchemeContext {
  schemes: ProcessedScheme[];
  totalSchemes: number;
  categories: string[];
  commonQuestions?: string[];
  metadata?: {
    lastUpdated: string;
    source: string;
    tokenCount?: number;
  };
}

export interface ConversationContext {
  userQuery: string;
  userProfile?: UserProfile;
  relevantSchemes: ProcessedScheme[];
  conversationHistory?: ChatHistory[];
  language: string;
  contextFormat: ContextFormat;
}

export interface UserProfile {
  businessType?: string;
  location?: {
    state?: string;
    district?: string;
    isRural?: boolean;
  };
  category?: string; // SC/ST/OBC/General
  gender?: string;
  businessStage?: 'planning' | 'new' | 'existing' | 'expansion';
  previousSchemes?: string[];
  interests?: string[];
}

export interface ChatHistory {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  mentionedSchemes?: string[];
}

export enum ContextFormat {
  JSON = 'json',
  MARKDOWN = 'markdown',
  STRUCTURED = 'structured',
  MINIMAL = 'minimal'
}

// Utility types for search and embeddings
export interface SchemeSearchResult {
  scheme: ProcessedScheme;
  score: number;
  matchedFields: string[];
  snippet?: string;
}

export interface SchemeEmbedding {
  schemeId: string;
  embedding: number[];
  metadata: {
    model: string;
    timestamp: Date;
  };
}

// Cache types
export interface SchemeCache {
  processed: Map<string, ProcessedScheme>;
  embeddings?: Map<string, SchemeEmbedding>;
  lastRefresh: Date;
  ttl: number; // Time to live in seconds
}

// Analytics types for optimization
export interface SchemeAnalytics {
  schemeId: string;
  viewCount: number;
  queryCount: number;
  applicationInitiated: number;
  userRatings?: number[];
  commonQueries: string[];
  averageRelevanceScore: number;
}
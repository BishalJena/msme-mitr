// Core type definitions for MSME Advisory System

// User Types
export interface User {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  language: Language;
  businessType?: BusinessType;
  state: string;
  district?: string;
  registrationDate: Date;
  lastActive: Date;
  preferences: UserPreferences;
  businessProfile?: BusinessProfile;
}

export interface UserPreferences {
  language: Language;
  notifications: boolean;
  theme?: 'light' | 'dark' | 'system';
  fontSize?: 'small' | 'medium' | 'large';
  voiceEnabled?: boolean;
}

export interface BusinessProfile {
  businessName: string;
  businessType: BusinessType;
  category: BusinessCategory;
  subCategory?: string;
  registrationNumber?: string;
  gstNumber?: string;
  yearEstablished?: number;
  employeeCount?: EmployeeRange;
  annualTurnover?: TurnoverRange;
  ownershipType: OwnershipType;
  socialCategory?: SocialCategory;
}

// Scheme Types
export interface Scheme {
  id: string;
  name: string;
  nameLocal: LocalizedContent;
  description: string;
  descriptionLocal: LocalizedContent;
  type: SchemeType;
  category: SchemeCategory[];
  ministry: string;
  department: string;
  benefits: Benefit[];
  eligibilityCriteria: EligibilityCriteria[];
  documentsRequired: Document[];
  applicationProcess: ApplicationStep[];
  importantDates?: ImportantDates;
  targetAudience: TargetAudience[];
  state?: string; // For state-specific schemes
  fundingAmount?: FundingDetails;
  contactInfo: ContactInfo;
  faqs?: FAQ[];
  successStories?: SuccessStory[];
  lastUpdated: Date;
  isActive: boolean;
}

export interface LocalizedContent {
  en: string;
  hi?: string;
  ta?: string;
  te?: string;
  bn?: string;
  gu?: string;
  kn?: string;
  ml?: string;
  mr?: string;
  or?: string;
  pa?: string;
  ur?: string;
}

export interface Benefit {
  id: string;
  type: BenefitType;
  description: string;
  descriptionLocal: LocalizedContent;
  amount?: string;
  icon?: string;
}

export interface EligibilityCriteria {
  id: string;
  criterion: string;
  criterionLocal: LocalizedContent;
  isMandatory: boolean;
  validationRule?: string;
  category?: string;
}

export interface Document {
  id: string;
  name: string;
  nameLocal: LocalizedContent;
  isMandatory: boolean;
  description?: string;
  sampleUrl?: string;
  category?: DocumentCategory;
}

export interface ApplicationStep {
  stepNumber: number;
  title: string;
  titleLocal: LocalizedContent;
  description: string;
  descriptionLocal: LocalizedContent;
  estimatedTime?: string;
  isOnline: boolean;
  url?: string;
}

export interface ImportantDates {
  applicationStartDate?: Date;
  applicationEndDate?: Date;
  resultDate?: Date;
  disbursementDate?: Date;
}

export interface FundingDetails {
  minAmount?: number;
  maxAmount?: number;
  currency: string;
  disbursementMode?: string;
  interestRate?: number;
  repaymentPeriod?: string;
}

export interface ContactInfo {
  phone?: string[];
  email?: string[];
  website?: string;
  office?: string;
  officeLocal?: LocalizedContent;
  helplineHours?: string;
}

export interface FAQ {
  question: string;
  questionLocal: LocalizedContent;
  answer: string;
  answerLocal: LocalizedContent;
}

export interface SuccessStory {
  id: string;
  title: string;
  story: string;
  beneficiaryName?: string;
  location?: string;
  schemeId: string;
  imageUrl?: string;
}

// Application Types
export interface Application {
  id: string;
  userId: string;
  schemeId: string;
  status: ApplicationStatus;
  submittedDate?: Date;
  lastUpdated: Date;
  trackingNumber?: string;
  documents: UploadedDocument[];
  formData: Record<string, any>;
  notes?: string;
  feedback?: ApplicationFeedback[];
}

export interface UploadedDocument {
  id: string;
  documentId: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: Date;
  status: DocumentStatus;
  verificationNotes?: string;
}

export interface ApplicationFeedback {
  date: Date;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
}

// Chat Types
export interface ChatMessage {
  id: string;
  conversationId: string;
  userId: string;
  content: string;
  contentType: 'text' | 'voice' | 'image' | 'document';
  language: Language;
  timestamp: Date;
  isBot: boolean;
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  intent?: string;
  confidence?: number;
  suggestedActions?: SuggestedAction[];
  relatedSchemes?: string[];
  translatedContent?: LocalizedContent;
}

export interface SuggestedAction {
  label: string;
  labelLocal: LocalizedContent;
  action: string;
  payload?: any;
}

export interface Conversation {
  id: string;
  userId: string;
  startTime: Date;
  lastMessageTime: Date;
  status: 'active' | 'resolved' | 'pending';
  topic?: string;
  language: Language;
  messages: ChatMessage[];
}

// Enums
export enum Language {
  EN = 'en',
  HI = 'hi',
  TA = 'ta',
  TE = 'te',
  BN = 'bn',
  GU = 'gu',
  KN = 'kn',
  ML = 'ml',
  MR = 'mr',
  OR = 'or',
  PA = 'pa',
  UR = 'ur'
}

export enum BusinessType {
  MICRO = 'micro',
  SMALL = 'small',
  MEDIUM = 'medium'
}

export enum BusinessCategory {
  MANUFACTURING = 'manufacturing',
  SERVICES = 'services',
  TRADING = 'trading',
  AGRICULTURE = 'agriculture',
  HANDICRAFTS = 'handicrafts',
  TEXTILES = 'textiles',
  FOOD_PROCESSING = 'food_processing',
  IT_SERVICES = 'it_services',
  RETAIL = 'retail',
  OTHERS = 'others'
}

export enum EmployeeRange {
  ZERO_TO_TEN = '0-10',
  ELEVEN_TO_FIFTY = '11-50',
  FIFTY_ONE_TO_HUNDRED = '51-100',
  HUNDRED_ONE_TO_TWO_FIFTY = '101-250',
  ABOVE_TWO_FIFTY = '250+'
}

export enum TurnoverRange {
  LESS_THAN_10L = '<10L',
  TEN_L_TO_50L = '10L-50L',
  FIFTY_L_TO_1CR = '50L-1Cr',
  ONE_CR_TO_5CR = '1Cr-5Cr',
  FIVE_CR_TO_25CR = '5Cr-25Cr',
  ABOVE_25CR = '>25Cr'
}

export enum OwnershipType {
  SOLE_PROPRIETORSHIP = 'sole_proprietorship',
  PARTNERSHIP = 'partnership',
  LLP = 'llp',
  PRIVATE_LIMITED = 'private_limited',
  PUBLIC_LIMITED = 'public_limited',
  COOPERATIVE = 'cooperative',
  OTHERS = 'others'
}

export enum SocialCategory {
  SC = 'sc',
  ST = 'st',
  OBC = 'obc',
  GENERAL = 'general',
  WOMEN_OWNED = 'women_owned',
  MINORITY = 'minority'
}

export enum SchemeType {
  SUBSIDY = 'subsidy',
  LOAN = 'loan',
  GRANT = 'grant',
  TAX_BENEFIT = 'tax_benefit',
  TRAINING = 'training',
  CERTIFICATION = 'certification',
  MARKETING_SUPPORT = 'marketing_support',
  TECHNOLOGY = 'technology',
  INFRASTRUCTURE = 'infrastructure'
}

export enum SchemeCategory {
  STARTUP = 'startup',
  WOMEN_ENTREPRENEUR = 'women_entrepreneur',
  RURAL = 'rural',
  EXPORT = 'export',
  SKILL_DEVELOPMENT = 'skill_development',
  DIGITAL = 'digital',
  GREEN_INITIATIVE = 'green_initiative',
  INNOVATION = 'innovation',
  CREDIT_GUARANTEE = 'credit_guarantee'
}

export enum TargetAudience {
  NEW_ENTREPRENEUR = 'new_entrepreneur',
  EXISTING_BUSINESS = 'existing_business',
  WOMEN = 'women',
  SC_ST = 'sc_st',
  RURAL = 'rural',
  URBAN = 'urban',
  YOUTH = 'youth',
  SENIOR_CITIZEN = 'senior_citizen'
}

export enum BenefitType {
  FINANCIAL = 'financial',
  TRAINING = 'training',
  MENTORSHIP = 'mentorship',
  MARKET_ACCESS = 'market_access',
  TECHNOLOGY = 'technology',
  CERTIFICATION = 'certification',
  INFRASTRUCTURE = 'infrastructure',
  RAW_MATERIAL = 'raw_material'
}

export enum DocumentCategory {
  IDENTITY = 'identity',
  ADDRESS = 'address',
  BUSINESS = 'business',
  FINANCIAL = 'financial',
  LEGAL = 'legal',
  OTHER = 'other'
}

export enum ApplicationStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  DOCUMENTS_PENDING = 'documents_pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  DISBURSED = 'disbursed'
}

export enum DocumentStatus {
  PENDING = 'pending',
  UPLOADED = 'uploaded',
  VERIFIED = 'verified',
  REJECTED = 'rejected'
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  pagination?: PaginationInfo;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Analytics Types
export interface AnalyticsEvent {
  eventName: string;
  userId?: string;
  timestamp: Date;
  properties?: Record<string, any>;
  sessionId?: string;
  platform?: 'web' | 'mobile';
}

export interface UserSession {
  sessionId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  language: Language;
  platform: 'web' | 'mobile';
  events: AnalyticsEvent[];
}
/**
 * Conversation Strategy Service
 * Implements intelligent dialogue flows for MSME advisory
 */

import { UserProfile, ProcessedScheme } from '@/types/scheme';
import { schemeDataService } from '../schemes/schemeDataService';

export interface ConversationIntent {
  type: 'credit' | 'subsidies' | 'certification' | 'tech' | 'export' | 'general' | 'unknown';
  confidence: number;
  suggestedGoals: string[];
  nextQuestions: string[];
}

export interface DocumentChecklist {
  required: string[];
  optional: string[];
  schemeSpecific: Record<string, string[]>;
}

export class ConversationStrategyService {
  /**
   * Core conversation principles
   */
  private readonly strategies = {
    startSimple: {
      greeting: {
        en: "Hello! I'm here to help you find the right government schemes for your business. Let's start with two quick questions:",
        hi: "नमस्ते! मैं आपके व्यवसाय के लिए सही सरकारी योजनाएं खोजने में मदद करने के लिए यहां हूं। आइए दो त्वरित प्रश्नों से शुरू करें:"
      },
      essentialQuestions: [
        {
          id: 'business_type',
          question: {
            en: "What type of business do you run? (e.g., manufacturing, service, trading)",
            hi: "आप किस प्रकार का व्यवसाय चलाते हैं? (जैसे: निर्माण, सेवा, व्यापार)"
          },
          examples: ['Textile manufacturing', 'IT services', 'Grocery store', 'Handicrafts']
        },
        {
          id: 'location',
          question: {
            en: "Where is your business located? (State/City)",
            hi: "आपका व्यवसाय कहाँ स्थित है? (राज्य/शहर)"
          },
          examples: ['Mumbai, Maharashtra', 'Coimbatore, Tamil Nadu', 'Rural Karnataka']
        }
      ]
    },
    progressiveDisclosure: {
      levels: [
        'essential', // Business type, location
        'intent',    // What they're looking for
        'profile',   // Size, turnover, employees
        'specific'   // Detailed requirements
      ]
    }
  };

  /**
   * Infer user intent from minimal input
   */
  public inferIntent(message: string): ConversationIntent {
    const msgLower = message.toLowerCase();

    // Credit/Loan intent
    if (this.hasKeywords(msgLower, ['loan', 'credit', 'fund', 'finance', 'capital', 'money', 'ऋण', 'पैसा'])) {
      return {
        type: 'credit',
        confidence: 0.9,
        suggestedGoals: [
          'Business expansion loan',
          'Working capital finance',
          'Machinery purchase',
          'Collateral-free credit'
        ],
        nextQuestions: [
          'How much funding do you need?',
          'Is this for a new business or expansion?',
          'Do you have collateral available?'
        ]
      };
    }

    // Subsidy intent
    if (this.hasKeywords(msgLower, ['subsidy', 'grant', 'support', 'assistance', 'अनुदान', 'सहायता'])) {
      return {
        type: 'subsidies',
        confidence: 0.85,
        suggestedGoals: [
          'Capital subsidy for machinery',
          'Interest subsidy on loans',
          'Marketing support',
          'Technology upgradation subsidy'
        ],
        nextQuestions: [
          'What specific area needs support?',
          'Are you in manufacturing or service sector?',
          'Is your unit in rural or urban area?'
        ]
      };
    }

    // Certification intent
    if (this.hasKeywords(msgLower, ['certificate', 'certification', 'quality', 'iso', 'zed', 'प्रमाणपत्र'])) {
      return {
        type: 'certification',
        confidence: 0.8,
        suggestedGoals: [
          'ISO certification',
          'ZED (Zero Defect) certification',
          'Quality mark certification',
          'BIS standards certification'
        ],
        nextQuestions: [
          'Which certification are you interested in?',
          'What products do you manufacture?',
          'Do you export your products?'
        ]
      };
    }

    // Technology intent
    if (this.hasKeywords(msgLower, ['technology', 'digital', 'software', 'automation', 'tech', 'upgrade'])) {
      return {
        type: 'tech',
        confidence: 0.8,
        suggestedGoals: [
          'Digital adoption',
          'Technology upgradation',
          'Automation support',
          'Software and tools subsidy'
        ],
        nextQuestions: [
          'What technology upgrade do you need?',
          'What is your current technology level?',
          'What is your budget for upgradation?'
        ]
      };
    }

    // Export intent
    if (this.hasKeywords(msgLower, ['export', 'international', 'foreign', 'निर्यात'])) {
      return {
        type: 'export',
        confidence: 0.85,
        suggestedGoals: [
          'Export promotion support',
          'International market access',
          'Export credit guarantee',
          'Participation in trade fairs'
        ],
        nextQuestions: [
          'Which countries do you export to?',
          'What products do you export?',
          'Do you need financial or marketing support?'
        ]
      };
    }

    // General or unknown intent
    return {
      type: 'unknown',
      confidence: 0.3,
      suggestedGoals: [
        'Get business loan',
        'Apply for subsidies',
        'Quality certification',
        'Technology upgradation',
        'Export support'
      ],
      nextQuestions: [
        'What kind of support are you looking for?',
        'What is your main business challenge?'
      ]
    };
  }

  /**
   * Clarify and confirm user intent
   */
  public generateClarification(intent: ConversationIntent, userMessage: string): string {
    const templates = {
      credit: "I understand you're looking for funding/credit options for your business. Is that correct?",
      subsidies: "You're interested in government subsidies and grants for your business, right?",
      certification: "You want to get quality certification for your products/services. Is that what you need?",
      tech: "You're looking for technology upgradation or digital adoption support. Am I understanding correctly?",
      export: "You need support for exporting your products internationally. Is that right?",
      unknown: "I want to make sure I understand correctly. Could you tell me which of these best describes what you're looking for?"
    };

    return templates[intent.type] || templates.unknown;
  }

  /**
   * Generate guided discovery questions
   */
  public getGuidedQuestions(
    stage: 'initial' | 'profile' | 'requirements' | 'documents',
    context: Partial<UserProfile>
  ): string[] {
    switch (stage) {
      case 'initial':
        return [
          "What type of business do you run?",
          "Where is your business located?",
          "What support are you looking for?"
        ];

      case 'profile':
        const profileQs = [];
        if (!context.businessType) {
          profileQs.push("Is your business in manufacturing, service, or trading?");
        }
        if (!context.annualTurnover) {
          profileQs.push("What is your approximate annual turnover?");
        }
        if (!context.employeeCount) {
          profileQs.push("How many employees do you have?");
        }
        if (!context.businessAge) {
          profileQs.push("How old is your business?");
        }
        return profileQs;

      case 'requirements':
        return [
          "How much funding do you need?",
          "What will you use the funds for?",
          "Do you have any existing loans?",
          "Can you provide collateral?"
        ];

      case 'documents':
        return [
          "Do you have Udyam Registration?",
          "Is your GST registration active?",
          "Do you have audited financial statements?",
          "Do you have a project report ready?"
        ];

      default:
        return [];
    }
  }

  /**
   * Generate document checklist based on schemes
   */
  public generateDocumentChecklist(
    schemes: ProcessedScheme[],
    userProfile: Partial<UserProfile>
  ): DocumentChecklist {
    const checklist: DocumentChecklist = {
      required: [
        'PAN Card',
        'Aadhaar Card',
        'Udyam Registration Certificate',
        'GST Registration (if applicable)',
        'Bank Account Statements (6 months)',
        'Business Address Proof'
      ],
      optional: [
        'Income Tax Returns (3 years)',
        'Audited Financial Statements',
        'CA Certificate',
        'Partnership Deed (if partnership)',
        'Company Registration (if company)'
      ],
      schemeSpecific: {}
    };

    // Add scheme-specific documents
    schemes.forEach(scheme => {
      const specificDocs: string[] = [];

      if (scheme.id === 'pmegp') {
        specificDocs.push(
          'Project Report',
          'Quotations for machinery',
          'Educational qualification certificate',
          'Caste certificate (if applicable)'
        );
      }

      if (scheme.id === 'mudra') {
        specificDocs.push(
          'Business Plan',
          'Quotations for purchases',
          'Proof of business vintage',
          'Property documents (if collateral)'
        );
      }

      if (scheme.id === 'stand-up-india') {
        specificDocs.push(
          'SC/ST/Woman certificate',
          'Project Report',
          'Experience certificate',
          'Training certificate (if any)'
        );
      }

      if (scheme.id === 'cgtmse') {
        specificDocs.push(
          'Loan application to bank',
          'CMA data',
          'Projected financials',
          'Collateral documents (negative list)'
        );
      }

      if (specificDocs.length > 0) {
        checklist.schemeSpecific[scheme.name] = specificDocs;
      }
    });

    return checklist;
  }

  /**
   * Generate actionable next steps
   */
  public generateNextSteps(
    matchedSchemes: ProcessedScheme[],
    userProfile: Partial<UserProfile>
  ): string[] {
    const steps: string[] = [];

    // Prioritize by user readiness
    if (!userProfile.hasUdyamRegistration) {
      steps.push('📝 Register on Udyam Portal (Free, Online, 10 minutes) - https://udyamregistration.gov.in');
    }

    // Add scheme-specific steps
    matchedSchemes.slice(0, 3).forEach(scheme => {
      const eligibilityMatch = this.checkEligibility(scheme, userProfile);

      if (eligibilityMatch.isEligible) {
        steps.push(`✅ Apply for ${scheme.name}: ${scheme.url}`);
      } else {
        steps.push(`⚠️ ${scheme.name}: First ${eligibilityMatch.missingRequirements[0]}`);
      }
    });

    // Add document preparation
    steps.push('📋 Prepare documents: Start with PAN, Aadhaar, and bank statements');

    // Add support contact
    steps.push('💬 Need help? Contact District Industries Centre (DIC) in your area');

    return steps;
  }

  /**
   * Check eligibility and return specific gaps
   */
  private checkEligibility(
    scheme: ProcessedScheme,
    profile: Partial<UserProfile>
  ): {
    isEligible: boolean;
    eligibleCriteria: string[];
    missingRequirements: string[];
  } {
    const eligible: string[] = [];
    const missing: string[] = [];

    // Check basic eligibility
    scheme.eligibilityCriteria.forEach(criteria => {
      const criteriaLower = criteria.toLowerCase();

      // Check business type
      if (criteriaLower.includes('manufactur') && profile.businessType === 'manufacturing') {
        eligible.push(criteria);
      } else if (criteriaLower.includes('service') && profile.businessType === 'service') {
        eligible.push(criteria);
      }

      // Check special categories
      if (criteriaLower.includes('women') && profile.category === 'Women') {
        eligible.push(criteria);
      } else if (criteriaLower.includes('sc/st') && ['SC', 'ST'].includes(profile.category || '')) {
        eligible.push(criteria);
      }

      // Check location
      if (criteriaLower.includes('rural') && profile.location?.district?.includes('Rural')) {
        eligible.push(criteria);
      }

      // Identify missing requirements
      if (criteriaLower.includes('udyam') && !profile.hasUdyamRegistration) {
        missing.push('Complete Udyam Registration');
      }
      if (criteriaLower.includes('gst') && !profile.gstNumber) {
        missing.push('Get GST Registration');
      }
    });

    return {
      isEligible: missing.length === 0 && eligible.length > 0,
      eligibleCriteria: eligible,
      missingRequirements: missing
    };
  }

  /**
   * Generate local examples based on user context
   */
  public getLocalExamples(
    schemeType: string,
    location?: { state?: string; district?: string }
  ): string[] {
    const examples: Record<string, Record<string, string[]>> = {
      loan: {
        maharashtra: [
          'Pune textile manufacturer got ₹25 lakhs through PMEGP',
          'Mumbai IT startup received ₹50 lakhs collateral-free loan'
        ],
        karnataka: [
          'Bangalore electronics unit expanded with CGTMSE support',
          'Mysore silk weaver got MUDRA loan for new looms'
        ],
        default: [
          'Small manufacturer upgraded machinery with government loan',
          'Service business expanded to new city with credit support'
        ]
      },
      subsidy: {
        maharashtra: [
          'Nashik grape processor got 25% capital subsidy',
          'Solapur textile unit saved ₹15 lakhs in machinery subsidy'
        ],
        karnataka: [
          'Coorg coffee exporter received quality certification subsidy',
          'Hubli MSME got technology upgradation support'
        ],
        default: [
          'Manufacturing unit saved 35% on new machinery',
          'Rural enterprise got higher subsidy rate'
        ]
      }
    };

    const state = location?.state?.toLowerCase() || 'default';
    const schemeExamples = examples[schemeType] || examples['loan'];

    return schemeExamples[state] || schemeExamples['default'];
  }

  /**
   * Check if message contains keywords
   */
  private hasKeywords(message: string, keywords: string[]): boolean {
    return keywords.some(keyword => message.includes(keyword));
  }

  /**
   * Generate simplified explanation for complex terms
   */
  public simplifyJargon(term: string): string {
    const dictionary: Record<string, string> = {
      'collateral': 'property or assets you pledge as security for loan',
      'turnover': 'total sales/revenue of your business in a year',
      'working capital': 'money needed for day-to-day business operations',
      'subsidy': 'government pays part of your cost',
      'credit guarantee': 'government backs your loan if you cannot pay',
      'cluster': 'group of similar businesses in same area',
      'incubation': 'support and guidance for new businesses',
      'equity': 'ownership share in your business',
      'moratorium': 'time period when you don\'t need to pay loan',
      'margin money': 'your contribution in total project cost'
    };

    return dictionary[term.toLowerCase()] || term;
  }
}

// Export singleton instance
export const conversationStrategy = new ConversationStrategyService();
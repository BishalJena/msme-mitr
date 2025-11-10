import {
  ProcessedScheme,
  ConversationContext,
  UserProfile,
  ChatHistory,
  ContextFormat,
  SchemeContext
} from '@/types/scheme';
import { schemeDataService } from '@/services/schemes/schemeDataService';
import { languageService, SupportedLanguage } from '@/services/language/languageService';
import {
  filterSchemes,
  getSchemesForProfile,
  rankSchemes,
  extractSchemeHighlights,
  formatAmount
} from '@/lib/schemes/schemeUtils';

/**
 * Context Builder for optimizing scheme data for LLM consumption
 * Manages token limits, relevance, and formatting
 */
export class LLMContextBuilder {
  private readonly TOKEN_LIMITS = {
    MINIMAL: 1000,     // ~4K characters
    STANDARD: 2500,    // ~10K characters
    DETAILED: 5000,    // ~20K characters
    MAXIMUM: 8000      // ~32K characters
  };

  private readonly TOKENS_PER_SCHEME = {
    MINIMAL: 50,       // Name + one-liner
    COMPACT: 150,      // Key facts only
    STANDARD: 300,     // Main details
    DETAILED: 600      // Full context
  };

  /**
   * Build optimized context for a conversation
   */
  buildConversationContext(params: {
    userQuery: string;
    userProfile?: UserProfile;
    conversationHistory?: ChatHistory[];
    language?: string;
    maxTokens?: number;
    includeAllSchemes?: boolean;
  }): ConversationContext {
    const {
      userQuery,
      userProfile,
      conversationHistory = [],
      language = 'en',
      maxTokens = this.TOKEN_LIMITS.STANDARD,
      includeAllSchemes = false
    } = params;

    // Determine context format based on token limit
    const contextFormat = this.determineContextFormat(maxTokens);

    // Get relevant schemes
    const relevantSchemes = includeAllSchemes
      ? schemeDataService.getAllSchemes()
      : this.selectRelevantSchemes(userQuery, userProfile, conversationHistory);

    // Optimize schemes for token limit
    const optimizedSchemes = this.optimizeSchemesForTokens(
      relevantSchemes,
      maxTokens,
      contextFormat
    );

    return {
      userQuery,
      userProfile,
      relevantSchemes: optimizedSchemes,
      conversationHistory,
      language,
      contextFormat
    };
  }

  /**
   * Generate system prompt with scheme context
   */
  generateSystemPrompt(context: ConversationContext): string {
    const schemeContext = this.formatSchemesForPrompt(
      context.relevantSchemes,
      context.contextFormat
    );

    // Get language-specific instructions
    const languageCode = (context.language || 'en') as SupportedLanguage;
    const languagePrompt = languageService.getLanguagePrompt(languageCode);
    const languageInfo = languageService.getSupportedLanguages().find(l => l.code === languageCode);

    // Enhanced system prompt with conversation strategies
    const systemPrompt = `You are an AI assistant specializing in Indian MSME government schemes. You have access to ${context.relevantSchemes.length} relevant schemes out of 11 total schemes.

${this.getUserProfileContext(context.userProfile)}

## Language Instructions:
${languagePrompt}
Primary Language: ${languageInfo?.nativeName || 'English'}
${languageCode !== 'en' ? `You should respond primarily in ${languageInfo?.nativeName}, but understand questions in both ${languageInfo?.nativeName} and English.` : 'Respond in simple, clear English suitable for Indian users.'}

## Conversation Strategy:
1. **Start Simple**: Begin with a friendly greeting and ask only 1-2 essential questions (business type & location)
2. **Clarify Intent**: Paraphrase the user's goal and confirm before proceeding
3. **Progressive Disclosure**: Ask only what's necessary at each step; avoid overwhelming with many questions
4. **Plain Language**: Use local examples, avoid jargon, explain complex terms simply
5. **Actionable Steps**: Provide clear next steps with eligibility checks, documents needed, and application links

## Core Capabilities:
- **Handle Vague Inputs**: Infer intent from minimal prompts and auto-suggest common goals:
  • Credit/loans for business expansion
  • Subsidies for machinery or technology
  • Quality certifications (ISO, ZED)
  • Technology upgradation support
  • Export promotion assistance

- **Guided Discovery**: Use branching dialogue for:
  • Scheme selection based on needs
  • Procurement readiness assessment
  • Compliance and certification guidance
  • Document preparation checklists

- **Smart Contextualization**: Adjust recommendations by:
  • Business sector and size
  • Location (urban/rural benefits)
  • Supply capacity and certifications
  • Specific challenges (working capital, machinery, marketing)

## Available Schemes Context:
${schemeContext}

## Response Guidelines:
- **Scheme Guidance**: Explain benefits, eligibility, required documents, fees, timelines, and exact authority
- **Document Prep**: Generate personalized checklists (PAN, Udyam, GST, bank statements, project reports, etc.)
- **Local Examples**: Use success stories from user's state/region when possible
- **Avoid Jargon**: Explain terms like "collateral" (property as loan security), "turnover" (yearly sales)
- **Progressive Questions**: Start broad, then narrow based on responses

## Your Role:
1. Quickly understand user's business and immediate needs
2. Suggest 2-3 most relevant schemes with clear reasoning
3. Provide step-by-step application guidance
4. Generate document checklists specific to chosen schemes
5. Offer alternative options if primary schemes don't fit
6. Connect to local support (District Industries Centre)

## Response Format:
- Lead with most relevant information
- Use bullet points for clarity
- Highlight key amounts (₹ in lakhs/crores)
- Include direct application links
- End with clear next steps
- Keep responses concise but complete
- Use emojis sparingly: 💰 funding, ✅ eligibility, 📝 documents, 🏭 manufacturing, 🛍️ trading, 💻 service

Remember: Users may have limited time, internet, and technical knowledge. Make every interaction count by being helpful, clear, and action-oriented. Many are first-time entrepreneurs or from rural areas - be patient and encouraging.`;

    return systemPrompt;
  }

  /**
   * Build minimal context for quick responses
   */
  buildMinimalContext(schemeIds?: string[]): string {
    const schemes = schemeIds
      ? schemeIds.map(id => schemeDataService.getSchemeById(id)).filter(Boolean) as ProcessedScheme[]
      : schemeDataService.getAllSchemes();

    return schemes
      .slice(0, 5)
      .map(scheme => scheme.minimalContext)
      .join('\n');
  }

  /**
   * Select relevant schemes based on query and context
   */
  private selectRelevantSchemes(
    query: string,
    userProfile?: UserProfile,
    history?: ChatHistory[]
  ): ProcessedScheme[] {
    const allSchemes = schemeDataService.getAllSchemes();

    // Extract intent from query
    const intent = this.extractQueryIntent(query);

    // Get schemes based on different strategies
    let relevantSchemes: ProcessedScheme[] = [];

    // Strategy 1: Direct search
    if (intent.searchTerms.length > 0) {
      const searchResults = schemeDataService.searchSchemes(
        intent.searchTerms.join(' ')
      );
      relevantSchemes.push(...searchResults);
    }

    // Strategy 2: Profile-based
    if (userProfile) {
      const profileSchemes = getSchemesForProfile(allSchemes, userProfile);
      relevantSchemes.push(...profileSchemes.slice(0, 3));
    }

    // Strategy 3: Category-based
    if (intent.categories.length > 0) {
      const categorySchemes = filterSchemes(allSchemes, {
        categories: intent.categories
      });
      relevantSchemes.push(...categorySchemes.slice(0, 3));
    }

    // Strategy 4: Previously mentioned schemes
    if (history && history.length > 0) {
      const mentionedSchemeIds = new Set<string>();
      history.forEach(msg => {
        msg.mentionedSchemes?.forEach(id => mentionedSchemeIds.add(id));
      });

      mentionedSchemeIds.forEach(id => {
        const scheme = schemeDataService.getSchemeById(id);
        if (scheme) relevantSchemes.push(scheme);
      });
    }

    // Remove duplicates and rank
    const uniqueSchemes = this.deduplicateSchemes(relevantSchemes);

    return rankSchemes(uniqueSchemes, {
      userProfile,
      searchQuery: query,
      preferOnline: query.toLowerCase().includes('online'),
      preferHighSubsidy: query.toLowerCase().includes('subsidy')
    });
  }

  /**
   * Extract intent from user query
   */
  private extractQueryIntent(query: string): {
    searchTerms: string[];
    categories: any[];
    needsAmount?: number;
    isUrgent: boolean;
  } {
    const queryLower = query.toLowerCase();
    const intent = {
      searchTerms: [] as string[],
      categories: [] as any[],
      needsAmount: undefined as number | undefined,
      isUrgent: false
    };

    // Extract search terms
    const keywords = [
      'pmegp', 'loan', 'subsidy', 'grant', 'training',
      'women', 'startup', 'rural', 'technology', 'export'
    ];

    keywords.forEach(keyword => {
      if (queryLower.includes(keyword)) {
        intent.searchTerms.push(keyword);
      }
    });

    // Extract categories
    if (queryLower.includes('loan') || queryLower.includes('credit')) {
      intent.categories.push('loan');
    }
    if (queryLower.includes('subsidy')) {
      intent.categories.push('subsidy');
    }
    if (queryLower.includes('training') || queryLower.includes('skill')) {
      intent.categories.push('training');
    }

    // Extract amount if mentioned
    const amountMatch = query.match(/₹?\s*(\d+)\s*(lakh|lac|l|crore|cr)?/i);
    if (amountMatch) {
      let amount = parseInt(amountMatch[1]);
      const unit = amountMatch[2]?.toLowerCase();
      if (unit?.startsWith('l')) amount *= 100000;
      if (unit?.startsWith('cr')) amount *= 10000000;
      intent.needsAmount = amount;
    }

    // Check urgency
    if (queryLower.includes('urgent') || queryLower.includes('immediate')) {
      intent.isUrgent = true;
    }

    return intent;
  }

  /**
   * Optimize schemes for token budget
   */
  private optimizeSchemesForTokens(
    schemes: ProcessedScheme[],
    maxTokens: number,
    format: ContextFormat
  ): ProcessedScheme[] {
    // Reserve tokens for system prompt and response
    const availableTokens = maxTokens * 0.6; // Use 60% for context

    // Calculate tokens per scheme based on format
    const tokensPerScheme = this.getTokensPerScheme(format);

    // Calculate how many schemes we can include
    const maxSchemes = Math.floor(availableTokens / tokensPerScheme);

    // Prioritize and truncate
    return schemes.slice(0, Math.min(maxSchemes, schemes.length));
  }

  /**
   * Format schemes for prompt inclusion
   */
  private formatSchemesForPrompt(
    schemes: ProcessedScheme[],
    format: ContextFormat
  ): string {
    switch (format) {
      case ContextFormat.JSON:
        return this.formatAsJSON(schemes);
      case ContextFormat.MARKDOWN:
        return this.formatAsMarkdown(schemes);
      case ContextFormat.STRUCTURED:
        return this.formatAsStructured(schemes);
      case ContextFormat.MINIMAL:
        return this.formatAsMinimal(schemes);
      default:
        return this.formatAsMarkdown(schemes);
    }
  }

  /**
   * Format as JSON (most token-efficient for structured data)
   */
  private formatAsJSON(schemes: ProcessedScheme[]): string {
    const jsonData = schemes.map(scheme => ({
      id: scheme.id,
      name: scheme.name,
      category: scheme.category,
      summary: scheme.summary,
      keyBenefits: scheme.keyBenefits.slice(0, 2),
      eligibility: scheme.eligibilityCriteria.slice(0, 2),
      financial: scheme.financialDetails ? {
        maxLoan: scheme.financialDetails.loanAmount?.max,
        subsidy: scheme.financialDetails.subsidyPercentage
      } : null,
      url: scheme.url
    }));

    return JSON.stringify(jsonData, null, 2);
  }

  /**
   * Format as Markdown (human-readable)
   */
  private formatAsMarkdown(schemes: ProcessedScheme[]): string {
    return schemes.map(scheme => {
      let md = `### ${scheme.name}\n`;
      md += `**Category:** ${scheme.category}\n`;
      md += `**Summary:** ${scheme.summary}\n`;

      if (scheme.keyBenefits.length > 0) {
        md += `**Key Benefits:**\n`;
        scheme.keyBenefits.slice(0, 3).forEach(benefit => {
          md += `- ${benefit}\n`;
        });
      }

      if (scheme.eligibilityCriteria.length > 0) {
        md += `**Eligibility:**\n`;
        scheme.eligibilityCriteria.slice(0, 2).forEach(criteria => {
          md += `- ${criteria}\n`;
        });
      }

      if (scheme.financialDetails) {
        const fd = scheme.financialDetails;
        if (fd.loanAmount?.max) {
          md += `**Max Loan:** ₹${formatAmount(fd.loanAmount.max)}\n`;
        }
        if (fd.subsidyPercentage) {
          md += `**Subsidy:** Urban ${fd.subsidyPercentage.urban}%, Rural ${fd.subsidyPercentage.rural}%\n`;
        }
      }

      md += `**Apply:** ${scheme.url}\n\n`;
      return md;
    }).join('---\n\n');
  }

  /**
   * Format as structured text
   */
  private formatAsStructured(schemes: ProcessedScheme[]): string {
    return schemes.map((scheme, index) => {
      return `[Scheme ${index + 1}]
Name: ${scheme.name}
Type: ${scheme.category}
For: ${scheme.targetAudience.slice(0, 2).join(', ')}
Benefits: ${scheme.keyBenefits[0] || 'Various benefits available'}
Eligibility: ${scheme.eligibilityCriteria[0] || 'Check detailed eligibility'}
${scheme.financialDetails?.loanAmount ? `Funding: Up to ₹${formatAmount(scheme.financialDetails.loanAmount.max || 0)}` : ''}
Link: ${scheme.url}
`;
    }).join('\n');
  }

  /**
   * Format as minimal text (maximum compression)
   */
  private formatAsMinimal(schemes: ProcessedScheme[]): string {
    return schemes.map(scheme => {
      const highlight = extractSchemeHighlights(scheme);
      return `${highlight} | Apply: ${scheme.url}`;
    }).join('\n');
  }

  /**
   * Get user profile context
   */
  private getUserProfileContext(profile?: UserProfile): string {
    if (!profile) return 'User Profile: Not provided';

    const parts: string[] = ['User Profile:'];

    if (profile.businessType) parts.push(`Business: ${profile.businessType}`);
    if (profile.businessStage) parts.push(`Stage: ${profile.businessStage}`);
    if (profile.location) {
      const loc = profile.location;
      parts.push(`Location: ${loc.district || ''} ${loc.state || ''} ${loc.isRural ? '(Rural)' : '(Urban)'}`);
    }
    if (profile.category) parts.push(`Category: ${profile.category}`);
    if (profile.gender) parts.push(`Gender: ${profile.gender}`);
    if (profile.interests) parts.push(`Interests: ${profile.interests.join(', ')}`);

    return parts.join(' | ');
  }

  /**
   * Determine context format based on token limit
   */
  private determineContextFormat(maxTokens: number): ContextFormat {
    if (maxTokens <= this.TOKEN_LIMITS.MINIMAL) {
      return ContextFormat.MINIMAL;
    } else if (maxTokens <= this.TOKEN_LIMITS.STANDARD) {
      return ContextFormat.STRUCTURED;
    } else if (maxTokens <= this.TOKEN_LIMITS.DETAILED) {
      return ContextFormat.MARKDOWN;
    } else {
      return ContextFormat.JSON;
    }
  }

  /**
   * Get tokens per scheme for format
   */
  private getTokensPerScheme(format: ContextFormat): number {
    switch (format) {
      case ContextFormat.MINIMAL:
        return this.TOKENS_PER_SCHEME.MINIMAL;
      case ContextFormat.STRUCTURED:
        return this.TOKENS_PER_SCHEME.COMPACT;
      case ContextFormat.MARKDOWN:
        return this.TOKENS_PER_SCHEME.STANDARD;
      case ContextFormat.JSON:
        return this.TOKENS_PER_SCHEME.DETAILED;
      default:
        return this.TOKENS_PER_SCHEME.STANDARD;
    }
  }

  /**
   * Deduplicate schemes
   */
  private deduplicateSchemes(schemes: ProcessedScheme[]): ProcessedScheme[] {
    const seen = new Set<string>();
    return schemes.filter(scheme => {
      if (seen.has(scheme.id)) {
        return false;
      }
      seen.add(scheme.id);
      return true;
    });
  }

  /**
   * Generate follow-up questions based on context
   */
  generateFollowUpQuestions(
    context: ConversationContext,
    response: string
  ): string[] {
    const questions: string[] = [];

    // If no profile, ask for profile info
    if (!context.userProfile?.businessType) {
      questions.push("What type of business do you have or plan to start?");
    }

    if (!context.userProfile?.location) {
      questions.push("Which state are you located in?");
    }

    // Ask about specific needs
    if (context.relevantSchemes.some(s => s.category === 'loan')) {
      questions.push("How much funding do you need for your business?");
    }

    // Ask about eligibility details
    if (!context.userProfile?.category) {
      questions.push("Do you belong to any special category (Women/SC/ST/OBC)?");
    }

    // Suggest next steps
    if (response.includes("PMEGP")) {
      questions.push("Would you like help with the PMEGP application process?");
    }

    return questions.slice(0, 3); // Return max 3 questions
  }

  /**
   * Update context with conversation feedback
   */
  updateContextWithFeedback(
    context: ConversationContext,
    userResponse: string,
    assistantResponse: string
  ): ConversationContext {
    // Add to conversation history
    const newHistory: ChatHistory[] = [
      ...context.conversationHistory || [],
      {
        role: 'user',
        content: userResponse,
        timestamp: new Date(),
        mentionedSchemes: this.extractMentionedSchemes(userResponse)
      },
      {
        role: 'assistant',
        content: assistantResponse,
        timestamp: new Date(),
        mentionedSchemes: this.extractMentionedSchemes(assistantResponse)
      }
    ];

    // Keep only last 10 messages for context
    const trimmedHistory = newHistory.slice(-10);

    return {
      ...context,
      conversationHistory: trimmedHistory,
      userQuery: userResponse // Update with latest query
    };
  }

  /**
   * Extract mentioned scheme IDs from text
   */
  private extractMentionedSchemes(text: string): string[] {
    const schemes = schemeDataService.getAllSchemes();
    const mentioned: string[] = [];

    schemes.forEach(scheme => {
      if (text.includes(scheme.name) ||
          (scheme.shortName && text.includes(scheme.shortName))) {
        mentioned.push(scheme.id);
      }
    });

    return mentioned;
  }
}

// Export singleton instance
export const llmContextBuilder = new LLMContextBuilder();
import {
  UserProfile,
  ChatHistory,
  ConversationContext,
  ProcessedScheme,
  ContextFormat
} from '@/types/scheme';
import { schemeDataService } from '@/services/schemes/schemeDataService';
import { llmContextBuilder } from '@/services/ai/contextBuilder';
import { getSchemesForProfile } from '@/lib/schemes/schemeUtils';

export interface ConversationSession {
  id: string;
  userId?: string;
  userProfile: UserProfile;
  history: ChatHistory[];
  createdAt: Date;
  lastActive: Date;
  language: string;
  contextCache?: Map<string, any>;
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
  language?: string;
  userProfile?: UserProfile;
}

export interface ChatResponse {
  message: string;
  suggestedActions?: string[];
  relevantSchemes?: ProcessedScheme[];
  requiresMoreInfo?: boolean;
  sessionId: string;
}

/**
 * Manages conversation state and context for AI chat
 */
export class ConversationManager {
  private sessions: Map<string, ConversationSession> = new Map();
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  constructor() {
    // Initialize scheme data on startup
    schemeDataService.refreshCacheIfNeeded();

    // Clean up expired sessions periodically
    setInterval(() => this.cleanupExpiredSessions(), 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Process a chat request with scheme context
   */
  async processChat(request: ChatRequest): Promise<{
    systemPrompt: string;
    context: ConversationContext;
    session: ConversationSession;
  }> {
    // Get or create session
    const session = this.getOrCreateSession(
      request.sessionId,
      request.userProfile,
      request.language
    );

    // Build conversation context
    const context = llmContextBuilder.buildConversationContext({
      userQuery: request.message,
      userProfile: session.userProfile,
      conversationHistory: session.history,
      language: session.language,
      maxTokens: this.determineTokenBudget(session),
      includeAllSchemes: this.shouldIncludeAllSchemes(request.message)
    });

    // Generate system prompt with scheme context
    const systemPrompt = llmContextBuilder.generateSystemPrompt(context);

    // Update session
    session.lastActive = new Date();

    return {
      systemPrompt,
      context,
      session
    };
  }

  /**
   * Update session after receiving response
   */
  updateSession(
    sessionId: string,
    userMessage: string,
    assistantResponse: string,
    mentionedSchemes?: string[]
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Add to history
    session.history.push(
      {
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
        mentionedSchemes: []
      },
      {
        role: 'assistant',
        content: assistantResponse,
        timestamp: new Date(),
        mentionedSchemes: mentionedSchemes || []
      }
    );

    // Keep history manageable (last 20 messages)
    if (session.history.length > 20) {
      session.history = session.history.slice(-20);
    }

    // Extract and update profile from conversation
    this.updateProfileFromConversation(session, userMessage);
  }

  /**
   * Get quick scheme suggestions for a user
   */
  getQuickSuggestions(sessionId?: string): ProcessedScheme[] {
    const session = sessionId ? this.sessions.get(sessionId) : null;

    if (session?.userProfile) {
      // Get personalized suggestions
      return getSchemesForProfile(
        schemeDataService.getAllSchemes(),
        session.userProfile
      ).slice(0, 3);
    }

    // Return popular schemes
    return schemeDataService.getAllSchemes().slice(0, 3);
  }

  /**
   * Generate smart follow-up questions
   */
  generateFollowUpQuestions(
    sessionId: string,
    lastResponse: string
  ): string[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    const questions: string[] = [];

    // Profile completion questions
    if (!session.userProfile.businessType) {
      questions.push("What type of business are you running or planning to start?");
    }

    if (!session.userProfile.location?.state) {
      questions.push("Which state are you located in?");
    }

    if (!session.userProfile.businessStage) {
      questions.push("Is this a new business or an existing one?");
    }

    // Context-specific questions
    if (lastResponse.toLowerCase().includes('loan')) {
      questions.push("How much funding do you need?");
    }

    if (lastResponse.toLowerCase().includes('eligib')) {
      questions.push("Would you like me to check your eligibility for specific schemes?");
    }

    if (lastResponse.toLowerCase().includes('application')) {
      questions.push("Do you need help with the application process?");
    }

    return questions.slice(0, 3);
  }

  /**
   * Get scheme recommendations based on session
   */
  getSchemeRecommendations(sessionId: string): {
    primary: ProcessedScheme[];
    complementary: ProcessedScheme[];
    trending: ProcessedScheme[];
  } {
    const session = this.sessions.get(sessionId);
    const allSchemes = schemeDataService.getAllSchemes();

    if (!session) {
      return {
        primary: allSchemes.slice(0, 3),
        complementary: [],
        trending: allSchemes.slice(3, 6)
      };
    }

    // Get personalized primary recommendations
    const primary = getSchemesForProfile(allSchemes, session.userProfile)
      .slice(0, 3);

    // Get complementary schemes
    const complementary = this.getComplementarySchemes(primary, allSchemes);

    // Get trending (popular) schemes
    const trending = allSchemes
      .filter(s => !primary.includes(s) && !complementary.includes(s))
      .slice(0, 3);

    return { primary, complementary, trending };
  }

  /**
   * Extract structured data from conversation
   */
  extractStructuredData(sessionId: string): {
    interestedSchemes: string[];
    businessInfo: Partial<UserProfile>;
    requirements: string[];
    nextSteps: string[];
  } {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return {
        interestedSchemes: [],
        businessInfo: {},
        requirements: [],
        nextSteps: []
      };
    }

    const interestedSchemes = new Set<string>();
    const requirements = new Set<string>();

    // Analyze conversation history
    session.history.forEach(entry => {
      if (entry.mentionedSchemes) {
        entry.mentionedSchemes.forEach(id => interestedSchemes.add(id));
      }

      // Extract requirements
      const text = entry.content.toLowerCase();
      if (text.includes('need') || text.includes('require') || text.includes('want')) {
        const needMatch = text.match(/(?:need|require|want)\s+([^.?!]+)/);
        if (needMatch) requirements.add(needMatch[1].trim());
      }
    });

    // Determine next steps based on conversation
    const nextSteps = this.determineNextSteps(session);

    return {
      interestedSchemes: Array.from(interestedSchemes),
      businessInfo: session.userProfile,
      requirements: Array.from(requirements),
      nextSteps
    };
  }

  /**
   * Get conversation summary
   */
  getConversationSummary(sessionId: string): string {
    const session = this.sessions.get(sessionId);
    if (!session || session.history.length === 0) {
      return "No conversation history available.";
    }

    const data = this.extractStructuredData(sessionId);
    let summary = "## Conversation Summary\n\n";

    // User profile
    if (Object.keys(data.businessInfo).length > 0) {
      summary += "**User Profile:**\n";
      if (data.businessInfo.businessType) summary += `- Business: ${data.businessInfo.businessType}\n`;
      if (data.businessInfo.businessStage) summary += `- Stage: ${data.businessInfo.businessStage}\n`;
      if (data.businessInfo.location?.state) summary += `- Location: ${data.businessInfo.location.state}\n`;
      summary += "\n";
    }

    // Discussed schemes
    if (data.interestedSchemes.length > 0) {
      summary += "**Schemes Discussed:**\n";
      data.interestedSchemes.forEach(id => {
        const scheme = schemeDataService.getSchemeById(id);
        if (scheme) {
          summary += `- ${scheme.name}\n`;
        }
      });
      summary += "\n";
    }

    // Requirements
    if (data.requirements.length > 0) {
      summary += "**Requirements:**\n";
      data.requirements.forEach(req => {
        summary += `- ${req}\n`;
      });
      summary += "\n";
    }

    // Next steps
    if (data.nextSteps.length > 0) {
      summary += "**Recommended Next Steps:**\n";
      data.nextSteps.forEach(step => {
        summary += `- ${step}\n`;
      });
    }

    return summary;
  }

  // Private helper methods

  /**
   * Get or create a session
   */
  private getOrCreateSession(
    sessionId?: string,
    userProfile?: UserProfile,
    language: string = 'en'
  ): ConversationSession {
    // Try to get existing session
    if (sessionId && this.sessions.has(sessionId)) {
      const session = this.sessions.get(sessionId)!;
      // Update profile if provided
      if (userProfile) {
        session.userProfile = { ...session.userProfile, ...userProfile };
      }
      return session;
    }

    // Create new session
    const newSessionId = sessionId || this.generateSessionId();
    const newSession: ConversationSession = {
      id: newSessionId,
      userProfile: userProfile || {},
      history: [],
      createdAt: new Date(),
      lastActive: new Date(),
      language,
      contextCache: new Map()
    };

    this.sessions.set(newSessionId, newSession);
    return newSession;
  }

  /**
   * Determine token budget based on session
   */
  private determineTokenBudget(session: ConversationSession): number {
    // Start with standard budget
    let budget = 2500;

    // Increase for detailed conversations
    if (session.history.length > 10) {
      budget = 3500;
    }

    // Increase if discussing multiple schemes
    const mentionedSchemes = new Set<string>();
    session.history.forEach(entry => {
      entry.mentionedSchemes?.forEach(id => mentionedSchemes.add(id));
    });

    if (mentionedSchemes.size > 3) {
      budget = 4000;
    }

    return budget;
  }

  /**
   * Check if all schemes should be included
   */
  private shouldIncludeAllSchemes(message: string): boolean {
    const keywords = [
      'all schemes',
      'show me everything',
      'list all',
      'what are all',
      'complete list'
    ];

    const messageLower = message.toLowerCase();
    return keywords.some(keyword => messageLower.includes(keyword));
  }

  /**
   * Update user profile from conversation
   */
  private updateProfileFromConversation(
    session: ConversationSession,
    message: string
  ): void {
    const messageLower = message.toLowerCase();

    // Extract business type
    if (!session.userProfile.businessType) {
      const businessTypes = [
        'manufacturing', 'service', 'trading', 'retail',
        'agriculture', 'handicraft', 'technology', 'export'
      ];

      businessTypes.forEach(type => {
        if (messageLower.includes(type)) {
          session.userProfile.businessType = type;
        }
      });
    }

    // Extract location
    if (!session.userProfile.location?.state) {
      // List of Indian states
      const states = [
        'karnataka', 'maharashtra', 'tamil nadu', 'gujarat',
        'delhi', 'uttar pradesh', 'kerala', 'rajasthan'
      ];

      states.forEach(state => {
        if (messageLower.includes(state)) {
          session.userProfile.location = {
            ...session.userProfile.location,
            state
          };
        }
      });
    }

    // Extract business stage
    if (!session.userProfile.businessStage) {
      if (messageLower.includes('start') || messageLower.includes('new')) {
        session.userProfile.businessStage = 'new';
      } else if (messageLower.includes('existing') || messageLower.includes('running')) {
        session.userProfile.businessStage = 'existing';
      } else if (messageLower.includes('expand') || messageLower.includes('growth')) {
        session.userProfile.businessStage = 'expansion';
      }
    }

    // Extract category
    if (messageLower.includes('women') || messageLower.includes('female')) {
      session.userProfile.gender = 'female';
    }

    if (messageLower.includes('sc') || messageLower.includes('st')) {
      session.userProfile.category = 'SC/ST';
    }
  }

  /**
   * Get complementary schemes
   */
  private getComplementarySchemes(
    primary: ProcessedScheme[],
    allSchemes: ProcessedScheme[]
  ): ProcessedScheme[] {
    const complementary: ProcessedScheme[] = [];

    primary.forEach(primaryScheme => {
      allSchemes.forEach(scheme => {
        // Skip if already in primary
        if (primary.includes(scheme)) return;

        // Add if complementary category
        if (
          (primaryScheme.category === 'loan' && scheme.category === 'subsidy') ||
          (primaryScheme.category === 'training' && scheme.category === 'certification')
        ) {
          if (!complementary.includes(scheme)) {
            complementary.push(scheme);
          }
        }
      });
    });

    return complementary.slice(0, 2);
  }

  /**
   * Determine next steps
   */
  private determineNextSteps(session: ConversationSession): string[] {
    const steps: string[] = [];

    // Based on profile completion
    if (!session.userProfile.businessType) {
      steps.push("Define your business type and industry");
    }

    if (!session.userProfile.location?.state) {
      steps.push("Provide your business location for state-specific schemes");
    }

    // Based on conversation
    const lastMessages = session.history.slice(-4);
    const recentText = lastMessages.map(m => m.content).join(' ').toLowerCase();

    if (recentText.includes('eligib')) {
      steps.push("Complete eligibility assessment for recommended schemes");
    }

    if (recentText.includes('application') || recentText.includes('apply')) {
      steps.push("Gather required documents for application");
      steps.push("Start online application process");
    }

    if (recentText.includes('loan') || recentText.includes('fund')) {
      steps.push("Prepare business plan and financial projections");
    }

    return steps.slice(0, 3);
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up expired sessions
   */
  private cleanupExpiredSessions(): void {
    const now = Date.now();

    this.sessions.forEach((session, id) => {
      const timeSinceActive = now - session.lastActive.getTime();
      if (timeSinceActive > this.SESSION_TIMEOUT) {
        this.sessions.delete(id);
      }
    });
  }
}

// Export singleton instance
export const conversationManager = new ConversationManager();
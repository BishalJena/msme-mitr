import Anthropic from '@anthropic-ai/sdk';
import { Message, MessageParam } from '@anthropic-ai/sdk/resources/messages';
import { Stream } from '@anthropic-ai/sdk/streaming';
import { ConversationContext, ProcessedScheme } from '@/types/scheme';
import { llmContextBuilder } from './contextBuilder';

/**
 * Service for interacting with Anthropic's Claude API
 * Optimized for MSME scheme advisory conversations
 */
export class AnthropicService {
  private client: Anthropic | null = null;
  private model: string;
  private maxTokens: number = 1024;
  private temperature: number = 0.7;

  constructor() {
    this.model = process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307';

    if (process.env.ANTHROPIC_API_KEY) {
      this.client = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }
  }

  /**
   * Check if the service is configured
   */
  isConfigured(): boolean {
    return this.client !== null;
  }

  /**
   * Generate system prompt optimized for MSME advisory
   */
  generateSystemPrompt(context: ConversationContext): string {
    const schemeContext = this.formatSchemeContext(context.relevantSchemes);
    const userContext = this.formatUserContext(context.userProfile);

    return `You are a friendly and patient AI advisor helping Indian MSME (Micro, Small, and Medium Enterprise) owners access government schemes and grow their businesses. Many of your users may have limited literacy or technical knowledge, so communicate in simple, clear language.

## Your Personality & Communication Style:
- Be warm, encouraging, and supportive - many users are first-time entrepreneurs
- Use simple words and short sentences
- Avoid jargon unless necessary, and always explain technical terms
- Be patient and don't assume prior knowledge
- Use analogies and examples from everyday life when explaining complex concepts
- Celebrate their entrepreneurial spirit
- If the user writes in Hindi or any Indian language, respond in the same language if possible

## User Context:
${userContext}

## Available Government Schemes:
You have knowledge of ${context.relevantSchemes.length} relevant government schemes. Here's the detailed information:

${schemeContext}

## Your Responsibilities:
1. **Understand Needs**: Ask clarifying questions to understand their business situation
2. **Recommend Schemes**: Based on their needs, suggest the most relevant schemes from your knowledge base
3. **Explain Simply**: Break down eligibility criteria and benefits in simple terms
4. **Guide Step-by-Step**: Provide clear, actionable next steps for applying
5. **Address Concerns**: Be sensitive to common worries (documentation, rejection, complexity)
6. **Encourage Action**: Motivate them to apply while being honest about requirements

## Important Guidelines:
- ONLY recommend schemes from the provided context - don't make up schemes
- Always mention the official scheme name when recommending
- Provide specific details like subsidy percentages, loan amounts, and eligibility criteria
- If asked about schemes not in your knowledge base, politely say you don't have that information
- Focus on one or two most relevant schemes rather than overwhelming with options
- When discussing money, use Indian number system (lakhs, crores) and ₹ symbol

## Common User Scenarios to Handle:
- "I need money for my business" → Ask about business type, stage, and amount needed
- "Am I eligible?" → Walk through eligibility criteria one by one
- "How to apply?" → Provide step-by-step application process
- "What documents needed?" → List specific documents in simple terms
- "I don't understand" → Rephrase in simpler language with examples

## Response Format:
- Start with a warm greeting or acknowledgment
- Address their immediate question/concern
- Provide relevant information from schemes
- Suggest next steps or ask clarifying questions
- End with encouragement or offer to help further

Remember: You're not just providing information - you're empowering entrepreneurs to access opportunities that can transform their businesses and lives.`;
  }

  /**
   * Format scheme context for the prompt
   */
  private formatSchemeContext(schemes: ProcessedScheme[]): string {
    return schemes.map((scheme, index) => {
      let context = `\n### ${index + 1}. ${scheme.name}\n`;
      context += `- **Category**: ${scheme.category}\n`;
      context += `- **Ministry**: ${scheme.ministry}\n`;
      context += `- **Summary**: ${scheme.summary}\n`;

      // Key Benefits
      if (scheme.keyBenefits.length > 0) {
        context += `- **Key Benefits**:\n`;
        scheme.keyBenefits.slice(0, 3).forEach(benefit => {
          context += `  • ${benefit}\n`;
        });
      }

      // Eligibility
      if (scheme.eligibilityCriteria.length > 0) {
        context += `- **Eligibility**:\n`;
        scheme.eligibilityCriteria.slice(0, 3).forEach(criteria => {
          context += `  • ${criteria}\n`;
        });
      }

      // Financial Details
      if (scheme.financialDetails) {
        const fd = scheme.financialDetails;
        if (fd.loanAmount?.max) {
          context += `- **Maximum Funding**: ₹${this.formatAmount(fd.loanAmount.max)}\n`;
        }
        if (fd.subsidyPercentage) {
          context += `- **Subsidy**: Urban ${fd.subsidyPercentage.urban}%, Rural ${fd.subsidyPercentage.rural}%\n`;
        }
      }

      // Target Audience
      if (scheme.targetAudience.length > 0) {
        context += `- **Best For**: ${scheme.targetAudience.join(', ')}\n`;
      }

      // Application
      context += `- **Online Application**: ${scheme.onlineApplication ? 'Yes' : 'No'}\n`;
      context += `- **Apply at**: ${scheme.url}\n`;

      return context;
    }).join('\n');
  }

  /**
   * Format user context
   */
  private formatUserContext(userProfile?: any): string {
    if (!userProfile || Object.keys(userProfile).length === 0) {
      return 'No specific user information available. Ask questions to understand their needs.';
    }

    const parts: string[] = [];
    if (userProfile.businessType) parts.push(`Business Type: ${userProfile.businessType}`);
    if (userProfile.businessStage) parts.push(`Stage: ${userProfile.businessStage}`);
    if (userProfile.location?.state) parts.push(`Location: ${userProfile.location.state}`);
    if (userProfile.location?.isRural) parts.push(`Area: ${userProfile.location.isRural ? 'Rural' : 'Urban'}`);
    if (userProfile.category) parts.push(`Category: ${userProfile.category}`);
    if (userProfile.gender) parts.push(`Gender: ${userProfile.gender}`);

    return parts.length > 0 ? parts.join(' | ') : 'Limited user information available.';
  }

  /**
   * Send a chat message and get response
   */
  async sendMessage(
    userMessage: string,
    context: ConversationContext,
    options: {
      stream?: boolean;
      maxTokens?: number;
      temperature?: number;
    } = {}
  ): Promise<Message | Stream<any>> {
    if (!this.client) {
      throw new Error('Anthropic client not configured. Please set ANTHROPIC_API_KEY.');
    }

    const systemPrompt = this.generateSystemPrompt(context);

    // Build message history
    const messages: MessageParam[] = [];

    // Add conversation history if available
    if (context.conversationHistory && context.conversationHistory.length > 0) {
      // Convert last 10 messages to Anthropic format
      context.conversationHistory.slice(-10).forEach(msg => {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      });
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: userMessage
    });

    try {
      if (options.stream) {
        // Return streaming response
        return await this.client.messages.create({
          model: this.model,
          system: systemPrompt,
          messages,
          max_tokens: options.maxTokens || this.maxTokens,
          temperature: options.temperature || this.temperature,
          stream: true
        });
      } else {
        // Return regular response
        return await this.client.messages.create({
          model: this.model,
          system: systemPrompt,
          messages,
          max_tokens: options.maxTokens || this.maxTokens,
          temperature: options.temperature || this.temperature,
        });
      }
    } catch (error) {
      console.error('Anthropic API error:', error);

      // Check for specific error types
      if (error instanceof Anthropic.APIError) {
        if (error.status === 429) {
          throw new Error('Rate limit exceeded. Please try again in a moment.');
        } else if (error.status === 401) {
          throw new Error('Invalid API key. Please check your configuration.');
        } else if (error.status === 500) {
          throw new Error('Service temporarily unavailable. Please try again.');
        }
      }

      throw new Error('Failed to get response from AI. Please try again.');
    }
  }

  /**
   * Generate a simple response for common queries (for fallback)
   */
  async generateFallbackResponse(
    query: string,
    schemes: ProcessedScheme[]
  ): Promise<string> {
    const queryLower = query.toLowerCase();

    // Simple pattern matching for common queries
    if (queryLower.includes('hello') || queryLower.includes('hi') || queryLower.includes('help')) {
      return this.getWelcomeMessage(schemes);
    }

    if (queryLower.includes('loan') || queryLower.includes('fund')) {
      return this.getLoanSchemeInfo(schemes);
    }

    if (queryLower.includes('eligib')) {
      return this.getEligibilityInfo(schemes);
    }

    if (queryLower.includes('apply') || queryLower.includes('application')) {
      return this.getApplicationInfo(schemes);
    }

    if (queryLower.includes('women')) {
      return this.getWomenSchemeInfo(schemes);
    }

    // Default response
    return `I can help you find government schemes for your business. Here are some options:

${schemes.slice(0, 3).map(s => `• ${s.name} - ${s.summary}`).join('\n')}

What specific support are you looking for? You can ask about:
- Business loans and funding
- Eligibility criteria
- Application process
- Documents required`;
  }

  /**
   * Pre-written responses for common scenarios
   */
  private getWelcomeMessage(schemes: ProcessedScheme[]): string {
    return `Namaste! 🙏 I'm here to help you find government schemes for your business.

We have ${schemes.length} schemes available that could help you:

${schemes.slice(0, 3).map(s => `• ${s.name} - ${s.category}`).join('\n')}

Tell me about your business:
- What type of business do you have?
- Are you just starting or already running it?
- How much funding do you need?

I'll find the best schemes for you!`;
  }

  private getLoanSchemeInfo(schemes: ProcessedScheme[]): string {
    const loanSchemes = schemes.filter(s =>
      s.category === 'loan' || s.category === 'subsidy'
    ).slice(0, 3);

    if (loanSchemes.length === 0) {
      return 'I can help you find funding options. Please tell me more about your business needs.';
    }

    let response = `Here are loan/funding schemes for your business:\n\n`;

    loanSchemes.forEach(scheme => {
      response += `📍 **${scheme.name}**\n`;
      if (scheme.financialDetails?.loanAmount?.max) {
        response += `   • Maximum: ₹${this.formatAmount(scheme.financialDetails.loanAmount.max)}\n`;
      }
      if (scheme.financialDetails?.subsidyPercentage) {
        response += `   • Subsidy: ${scheme.financialDetails.subsidyPercentage.urban}% (Urban) / ${scheme.financialDetails.subsidyPercentage.rural}% (Rural)\n`;
      }
      response += `   • ${scheme.summary}\n\n`;
    });

    response += `Which scheme interests you? I can explain eligibility and application process.`;
    return response;
  }

  private getEligibilityInfo(schemes: ProcessedScheme[]): string {
    const scheme = schemes[0];
    if (!scheme) return 'Please tell me which scheme you want to check eligibility for.';

    let response = `Eligibility for **${scheme.name}**:\n\n`;

    scheme.eligibilityCriteria.slice(0, 5).forEach(criteria => {
      response += `✅ ${criteria}\n`;
    });

    response += `\nDo you meet these criteria? Let me know if you need clarification on any point.`;
    return response;
  }

  private getApplicationInfo(schemes: ProcessedScheme[]): string {
    const scheme = schemes[0];
    if (!scheme) return 'Which scheme would you like to apply for?';

    let response = `How to apply for **${scheme.name}**:\n\n`;

    response += `📝 **Steps**:\n`;
    scheme.applicationSteps.slice(0, 5).forEach((step, index) => {
      response += `${index + 1}. ${step}\n`;
    });

    response += `\n📋 **Documents Needed**:\n`;
    scheme.documentsNeeded.forEach(doc => {
      response += `• ${doc}\n`;
    });

    response += `\n🔗 Apply online: ${scheme.url}\n`;
    response += `\nNeed help with any step? I can guide you!`;

    return response;
  }

  private getWomenSchemeInfo(schemes: ProcessedScheme[]): string {
    const womenSchemes = schemes.filter(s =>
      s.targetAudience.some(a => a.toLowerCase().includes('women'))
    ).slice(0, 3);

    if (womenSchemes.length === 0) {
      return 'Let me find schemes with special benefits for women entrepreneurs...';
    }

    let response = `Special schemes for women entrepreneurs:\n\n`;

    womenSchemes.forEach(scheme => {
      response += `👩‍💼 **${scheme.name}**\n`;
      response += `   • ${scheme.summary}\n`;
      response += `   • Special benefits for women\n\n`;
    });

    response += `Women often get higher subsidies and priority processing. Which scheme would you like to explore?`;
    return response;
  }

  /**
   * Format amount in Indian numbering
   */
  private formatAmount(amount: number): string {
    if (amount >= 10000000) {
      return `${(amount / 10000000).toFixed(1)} Crore`;
    } else if (amount >= 100000) {
      return `${(amount / 100000).toFixed(1)} Lakh`;
    }
    return amount.toLocaleString('en-IN');
  }

  /**
   * Extract mentioned schemes from response
   */
  extractMentionedSchemes(response: string, schemes: ProcessedScheme[]): string[] {
    const mentioned: string[] = [];

    schemes.forEach(scheme => {
      if (response.includes(scheme.name) ||
          (scheme.shortName && response.includes(scheme.shortName))) {
        mentioned.push(scheme.id);
      }
    });

    return mentioned;
  }

  /**
   * Check if response needs follow-up
   */
  needsFollowUp(response: string): boolean {
    const followUpIndicators = [
      'tell me more',
      'what type',
      'which',
      'how much',
      'where',
      'can you',
      'please provide',
      '?'
    ];

    const responseLower = response.toLowerCase();
    return followUpIndicators.some(indicator => responseLower.includes(indicator));
  }
}

// Export singleton instance
export const anthropicService = new AnthropicService();
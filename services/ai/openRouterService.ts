import OpenAI from 'openai';
import { Stream } from 'openai/streaming';
import { ConversationContext, ProcessedScheme } from '@/types/scheme';

/**
 * Service for interacting with OpenRouter API
 * Provides access to multiple LLM models through a unified interface
 * Optimized for MSME scheme advisory conversations
 */
export class OpenRouterService {
  private client: OpenAI | null = null;
  private model: string;
  private maxTokens: number = 1024;
  private temperature: number = 0.7;

  // Model pricing (per million tokens) for cost optimization
  private modelPricing: Record<string, { input: number; output: number }> = {
    'anthropic/claude-3-haiku': { input: 0.25, output: 1.25 },
    'anthropic/claude-3-sonnet': { input: 3, output: 15 },
    'anthropic/claude-3-opus': { input: 15, output: 75 },
    'openai/gpt-3.5-turbo': { input: 0.5, output: 1.5 },
    'openai/gpt-4-turbo-preview': { input: 10, output: 30 },
    'meta-llama/llama-3-70b-instruct': { input: 0.8, output: 0.8 },
    'mistralai/mistral-7b-instruct': { input: 0.25, output: 0.25 },
    'google/gemini-pro': { input: 0.5, output: 1.5 }
  };

  constructor() {
    this.model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-haiku';

    if (process.env.OPENROUTER_API_KEY) {
      this.client = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: process.env.OPENROUTER_API_KEY,
        defaultHeaders: {
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          "X-Title": "MSME Mitr - AI Business Advisor",
        }
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
   * Adapted for multiple model types
   */
  generateSystemPrompt(context: ConversationContext): string {
    const schemeContext = this.formatSchemeContext(context.relevantSchemes);
    const userContext = this.formatUserContext(context.userProfile);

    // Adjust prompt based on model capabilities
    const isAdvancedModel = this.model.includes('opus') ||
                           this.model.includes('gpt-4') ||
                           this.model.includes('claude-3-sonnet');

    const basePrompt = `You are a friendly and patient AI advisor helping Indian MSME (Micro, Small, and Medium Enterprise) owners access government schemes and grow their businesses. Many of your users may have limited literacy or technical knowledge, so communicate in simple, clear language.

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
- When discussing money, use Indian number system (lakhs, crores) and ₹ symbol`;

    // Add advanced instructions for capable models
    const advancedInstructions = isAdvancedModel ? `

## Advanced Capabilities:
- Analyze user's business profile to identify growth opportunities
- Compare multiple schemes and suggest optimal combinations
- Provide strategic advice on timing and sequencing of applications
- Identify potential challenges and suggest mitigation strategies
- Offer insights on maximizing benefits across multiple schemes` : '';

    const responseFormat = `

## Response Format:
- Start with a warm greeting or acknowledgment
- Address their immediate question/concern
- Provide relevant information from schemes
- Suggest next steps or ask clarifying questions
- End with encouragement or offer to help further

Remember: You're not just providing information - you're empowering entrepreneurs to access opportunities that can transform their businesses and lives.`;

    return basePrompt + advancedInstructions + responseFormat;
  }

  /**
   * Format scheme context based on model capabilities
   */
  private formatSchemeContext(schemes: ProcessedScheme[]): string {
    // Use more concise format for smaller models
    const isCompactModel = this.model.includes('haiku') ||
                          this.model.includes('7b') ||
                          this.model.includes('gpt-3.5');

    if (isCompactModel) {
      return this.formatCompactSchemeContext(schemes);
    }

    return this.formatDetailedSchemeContext(schemes);
  }

  /**
   * Compact format for efficient models
   */
  private formatCompactSchemeContext(schemes: ProcessedScheme[]): string {
    return schemes.map((scheme, index) => {
      let context = `\n${index + 1}. **${scheme.name}** (${scheme.category})\n`;
      context += `   Summary: ${scheme.summary}\n`;

      if (scheme.financialDetails) {
        const fd = scheme.financialDetails;
        if (fd.loanAmount?.max) {
          context += `   Max Funding: ₹${this.formatAmount(fd.loanAmount.max)}\n`;
        }
        if (fd.subsidyPercentage) {
          context += `   Subsidy: ${fd.subsidyPercentage.urban}%-${fd.subsidyPercentage.rural}%\n`;
        }
      }

      context += `   For: ${scheme.targetAudience.slice(0, 2).join(', ')}\n`;
      context += `   Apply: ${scheme.url}\n`;

      return context;
    }).join('\n');
  }

  /**
   * Detailed format for advanced models
   */
  private formatDetailedSchemeContext(schemes: ProcessedScheme[]): string {
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
        if (fd.collateralRequired !== undefined) {
          context += `- **Collateral Required**: ${fd.collateralRequired ? 'Yes' : 'No'}\n`;
        }
      }

      // Target Audience
      if (scheme.targetAudience.length > 0) {
        context += `- **Best For**: ${scheme.targetAudience.join(', ')}\n`;
      }

      // Application Details
      context += `- **Online Application**: ${scheme.onlineApplication ? 'Yes' : 'No'}\n`;

      if (scheme.documentsNeeded.length > 0) {
        context += `- **Key Documents**: ${scheme.documentsNeeded.slice(0, 3).join(', ')}\n`;
      }

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
    if (userProfile.interests) parts.push(`Interests: ${userProfile.interests.join(', ')}`);

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
      model?: string;
    } = {}
  ): Promise<OpenAI.Chat.ChatCompletion | Stream<OpenAI.Chat.ChatCompletionChunk>> {
    if (!this.client) {
      throw new Error('OpenRouter client not configured. Please set OPENROUTER_API_KEY.');
    }

    const systemPrompt = this.generateSystemPrompt(context);
    const selectedModel = options.model || this.model;

    // Build message history
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: systemPrompt
      }
    ];

    // Add conversation history if available
    if (context.conversationHistory && context.conversationHistory.length > 0) {
      // Limit history based on model capacity
      const historyLimit = this.getHistoryLimit(selectedModel);
      const recentHistory = context.conversationHistory.slice(-historyLimit);

      recentHistory.forEach(msg => {
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
      const completionOptions: OpenAI.Chat.ChatCompletionCreateParams = {
        model: selectedModel,
        messages,
        max_tokens: options.maxTokens || this.maxTokens,
        temperature: options.temperature || this.temperature,
        stream: options.stream || false,
      };

      if (options.stream) {
        // Return streaming response
        return await this.client.chat.completions.create({
          ...completionOptions,
          stream: true
        }) as Stream<OpenAI.Chat.ChatCompletionChunk>;
      } else {
        // Return regular response
        return await this.client.chat.completions.create(completionOptions);
      }
    } catch (error: any) {
      console.error('OpenRouter API error:', error);

      // Handle specific error types
      if (error?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      } else if (error?.status === 401) {
        throw new Error('Invalid API key. Please check your OpenRouter configuration.');
      } else if (error?.status === 400) {
        // Try with a fallback model if the selected model fails
        if (selectedModel !== 'anthropic/claude-3-haiku') {
          console.log('Falling back to Claude Haiku model...');
          return this.sendMessage(userMessage, context, {
            ...options,
            model: 'anthropic/claude-3-haiku'
          });
        }
        throw new Error('Invalid request. Please try with a different query.');
      } else if (error?.status >= 500) {
        throw new Error('Service temporarily unavailable. Please try again.');
      }

      throw new Error('Failed to get response from AI. Please try again.');
    }
  }

  /**
   * Get history limit based on model
   */
  private getHistoryLimit(model: string): number {
    if (model.includes('opus') || model.includes('gpt-4')) {
      return 20; // Large context models
    } else if (model.includes('sonnet') || model.includes('70b')) {
      return 10; // Medium context models
    } else {
      return 6; // Smaller context models
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
   * Estimate cost for a message
   */
  estimateCost(messageLength: number, responseLength: number, model?: string): number {
    const selectedModel = model || this.model;
    const pricing = this.modelPricing[selectedModel] || { input: 1, output: 3 };

    const inputTokens = Math.ceil(messageLength / 4);
    const outputTokens = Math.ceil(responseLength / 4);

    const inputCost = (inputTokens / 1000000) * pricing.input;
    const outputCost = (outputTokens / 1000000) * pricing.output;

    return inputCost + outputCost;
  }

  /**
   * Get available models
   */
  getAvailableModels(): Array<{ id: string; name: string; category: string }> {
    return [
      // Claude Models
      { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', category: 'Fast & Affordable' },
      { id: 'anthropic/claude-3-sonnet', name: 'Claude 3 Sonnet', category: 'Balanced' },
      { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus', category: 'Most Capable' },

      // GPT Models
      { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo', category: 'Fast & Affordable' },
      { id: 'openai/gpt-4-turbo-preview', name: 'GPT-4 Turbo', category: 'Advanced' },

      // Open Source
      { id: 'meta-llama/llama-3-70b-instruct', name: 'Llama 3 70B', category: 'Open Source' },
      { id: 'mistralai/mistral-7b-instruct', name: 'Mistral 7B', category: 'Efficient' },
      { id: 'google/gemini-pro', name: 'Gemini Pro', category: 'Google' }
    ];
  }
}

// Export singleton instance
export const openRouterService = new OpenRouterService();
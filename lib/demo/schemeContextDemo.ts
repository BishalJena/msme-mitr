/**
 * Demonstration of the Scheme Data Layer for AI Context
 * This file shows how the system provides optimized scheme data to the LLM
 */

import { schemeDataService } from '@/services/schemes/schemeDataService';
import { llmContextBuilder } from '@/services/ai/contextBuilder';
import { conversationManager } from '@/services/chat/conversationManager';
import { UserProfile } from '@/types/scheme';

export async function demonstrateSchemeContext() {
  console.log('🚀 MSME Mitr AI - Scheme Data Layer Demo\n');
  console.log('=' .repeat(60));

  // 1. Show total schemes available
  const allSchemes = await schemeDataService.getAllSchemes();
  console.log(`\n📊 Total Schemes Loaded: ${allSchemes.length}`);
  console.log('Categories:', [...new Set(allSchemes.map(s => s.category))].join(', '));

  // 2. Demonstrate user query processing
  console.log('\n' + '='.repeat(60));
  console.log('\n🔍 Example 1: User asks about loans\n');

  const loanQuery = "I need a loan for my small manufacturing business";
  const loanContext = await llmContextBuilder.buildConversationContext({
    userQuery: loanQuery,
    maxTokens: 2500
  });

  console.log(`Query: "${loanQuery}"`);
  console.log(`Relevant Schemes Found: ${loanContext.relevantSchemes.length}`);
  console.log('Schemes:', loanContext.relevantSchemes.map(s => s.name).join(', '));

  const systemPrompt = await llmContextBuilder.generateSystemPrompt(loanContext);
  console.log(`\nSystem Prompt Length: ${systemPrompt.length} characters (~${Math.ceil(systemPrompt.length/4)} tokens)`);
  console.log('\nFirst 500 chars of System Prompt:');
  console.log(systemPrompt.substring(0, 500) + '...');

  // 3. Demonstrate profile-based filtering
  console.log('\n' + '='.repeat(60));
  console.log('\n👤 Example 2: Women Entrepreneur Profile\n');

  const womenProfile: UserProfile = {
    gender: 'female',
    businessStage: 'new',
    location: { state: 'Karnataka', isRural: true },
    interests: ['manufacturing', 'handicrafts']
  };

  const womenContext = await llmContextBuilder.buildConversationContext({
    userQuery: "What schemes are available for me?",
    userProfile: womenProfile,
    maxTokens: 2000
  });

  console.log('Profile:', JSON.stringify(womenProfile, null, 2));
  console.log(`\nPersonalized Schemes: ${womenContext.relevantSchemes.length}`);
  womenContext.relevantSchemes.slice(0, 3).forEach(scheme => {
    console.log(`- ${scheme.name} (${scheme.category})`);
    if (scheme.financialDetails?.subsidyPercentage) {
      const subsidy = scheme.financialDetails.subsidyPercentage;
      console.log(`  Subsidy: Rural ${subsidy.rural}%, Urban ${subsidy.urban}%`);
    }
  });

  // 4. Show token optimization
  console.log('\n' + '='.repeat(60));
  console.log('\n⚡ Example 3: Token Optimization\n');

  const formats = ['minimal', 'standard', 'detailed'];
  const tokenLimits = [1000, 2500, 5000];

  for (let i = 0; i < formats.length; i++) {
    const format = formats[i];
    const context = await llmContextBuilder.buildConversationContext({
      userQuery: "Show me all schemes",
      maxTokens: tokenLimits[i],
      includeAllSchemes: true
    });

    const tokenEstimate = await schemeDataService.getTokenEstimate(
      context.relevantSchemes,
      format as 'minimal' | 'detailed'
    );

    console.log(`Format: ${format.toUpperCase()}`);
    console.log(`  - Max Tokens: ${tokenLimits[i]}`);
    console.log(`  - Schemes Included: ${context.relevantSchemes.length}`);
    console.log(`  - Estimated Tokens: ${tokenEstimate}`);
  }

  // 5. Demonstrate conversation flow
  console.log('\n' + '='.repeat(60));
  console.log('\n💬 Example 4: Multi-turn Conversation\n');

  // First message
  const chat1 = await conversationManager.processChat({
    message: "Hello, I want to start a business",
  });

  console.log('User: "Hello, I want to start a business"');
  console.log(`AI Context: ${chat1.context.relevantSchemes.length} schemes ready`);
  console.log(`Session ID: ${chat1.session.id}`);

  // Update session with response
  conversationManager.updateSession(
    chat1.session.id,
    "Hello, I want to start a business",
    "I can help you start your business! The main scheme for new entrepreneurs is PMEGP...",
    ['pmegp']
  );

  // Second message
  const chat2 = await conversationManager.processChat({
    message: "Tell me more about PMEGP",
    sessionId: chat1.session.id
  });

  console.log('\nUser: "Tell me more about PMEGP"');
  console.log(`Conversation History: ${chat2.session.history.length} messages`);
  console.log(`PMEGP Scheme Loaded: ${chat2.context.relevantSchemes.find(s => s.name.includes('PMEGP')) ? 'Yes' : 'No'}`);

  // 6. Show scheme statistics
  console.log('\n' + '='.repeat(60));
  console.log('\n📈 Scheme Statistics\n');

  const stats = {
    totalSchemes: allSchemes.length,
    withOnlineApplication: allSchemes.filter(s => s.onlineApplication).length,
    withFinancialSupport: allSchemes.filter(s => s.financialDetails).length,
    byCategory: {} as Record<string, number>
  };

  allSchemes.forEach(scheme => {
    stats.byCategory[scheme.category] = (stats.byCategory[scheme.category] || 0) + 1;
  });

  console.log('Overall Statistics:');
  console.log(`  - Total Schemes: ${stats.totalSchemes}`);
  console.log(`  - Online Applications: ${stats.withOnlineApplication}`);
  console.log(`  - Financial Support: ${stats.withFinancialSupport}`);
  console.log('\nBy Category:');
  Object.entries(stats.byCategory).forEach(([cat, count]) => {
    console.log(`  - ${cat}: ${count} schemes`);
  });

  // 7. Show memory efficiency
  console.log('\n' + '='.repeat(60));
  console.log('\n💾 Memory & Efficiency\n');

  const minimalContext = await llmContextBuilder.buildMinimalContext();
  console.log(`Minimal Context (All Schemes): ${minimalContext.length} chars`);
  console.log(`Average per scheme: ${Math.round(minimalContext.length / allSchemes.length)} chars`);

  const summary = await conversationManager.getConversationSummary(chat2.session.id);
  console.log('\nConversation Summary Generated:');
  console.log(summary.substring(0, 300) + '...');

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Demo Complete! The data layer is ready for LLM integration.\n');

  return {
    schemesLoaded: allSchemes.length,
    contextBuilderReady: true,
    conversationManagerReady: true,
    optimizationEnabled: true
  };
}

// Export for testing
export async function testSchemeDataLayer() {
  try {
    const result = await demonstrateSchemeContext();
    return {
      success: true,
      ...result
    };
  } catch (error) {
    console.error('Error in scheme data layer:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
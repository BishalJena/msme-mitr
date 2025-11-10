/**
 * Offline Mode and Network Detection Service
 * Handles offline functionality and caching for the MSME Advisory System
 */

import { ProcessedScheme } from '@/types/scheme';
import { schemeDataService } from '../schemes/schemeDataService';

export interface OfflineCache {
  schemes: ProcessedScheme[];
  lastUpdated: Date;
  commonQuestions: {
    question: string;
    answer: string;
    keywords: string[];
  }[];
}

export class OfflineService {
  private static instance: OfflineService;
  private isOnline: boolean = true;
  private cache: OfflineCache | null = null;
  private listeners: Set<(online: boolean) => void> = new Set();
  private readonly CACHE_KEY = 'msme_offline_cache';
  private readonly CACHE_VERSION = '1.0.0';

  private constructor() {
    this.initializeCache();
    this.setupNetworkListeners();
  }

  static getInstance(): OfflineService {
    if (!OfflineService.instance) {
      OfflineService.instance = new OfflineService();
    }
    return OfflineService.instance;
  }

  /**
   * Initialize offline cache from localStorage
   */
  private initializeCache(): void {
    if (typeof window === 'undefined') return;

    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        if (parsedCache.version === this.CACHE_VERSION) {
          this.cache = {
            ...parsedCache.data,
            lastUpdated: new Date(parsedCache.data.lastUpdated)
          };
        }
      }

      // Initialize cache if not present
      if (!this.cache) {
        this.updateCache();
      }
    } catch (error) {
      console.error('Failed to load offline cache:', error);
      this.updateCache();
    }
  }

  /**
   * Setup network status listeners
   */
  private setupNetworkListeners(): void {
    if (typeof window === 'undefined') return;

    // Initial status
    this.isOnline = navigator.onLine;

    // Listen for network changes
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners(true);
      console.log('📶 Back online - syncing data...');
      this.syncData();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners(false);
      console.log('📵 Offline mode activated');
    });
  }

  /**
   * Update the offline cache
   */
  public updateCache(): void {
    const schemes = schemeDataService.getAllSchemes();

    this.cache = {
      schemes,
      lastUpdated: new Date(),
      commonQuestions: this.generateCommonQuestions(schemes)
    };

    // Save to localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.CACHE_KEY, JSON.stringify({
          version: this.CACHE_VERSION,
          data: this.cache
        }));
      } catch (error) {
        console.error('Failed to save offline cache:', error);
      }
    }
  }

  /**
   * Generate common questions for offline mode
   */
  private generateCommonQuestions(schemes: ProcessedScheme[]): OfflineCache['commonQuestions'] {
    return [
      {
        question: "What government schemes am I eligible for?",
        answer: `There are ${schemes.length} government schemes available for MSMEs. The main categories are:\n\n• **Loans & Credit**: Financial assistance for business growth\n• **Subsidies**: Government support to reduce costs\n• **Training**: Skill development programs\n• **Technology**: Modernization and upgradation support\n• **Marketing**: Export promotion and market access\n\nTo find the best schemes for you, I need to know your business type, location, and specific needs.`,
        keywords: ["eligible", "eligibility", "qualify", "schemes"]
      },
      {
        question: "How can I get a business loan?",
        answer: this.generateLoanAnswer(schemes),
        keywords: ["loan", "credit", "fund", "finance", "money", "capital"]
      },
      {
        question: "What are PMEGP scheme benefits?",
        answer: this.generatePMEGPAnswer(schemes),
        keywords: ["pmegp", "prime minister", "employment", "generation"]
      },
      {
        question: "Are there special schemes for women entrepreneurs?",
        answer: this.generateWomenSchemeAnswer(schemes),
        keywords: ["women", "female", "lady", "mahila"]
      },
      {
        question: "How to apply for government schemes?",
        answer: `General application process for MSME schemes:\n\n1. **Check Eligibility**: Verify you meet criteria\n2. **Gather Documents**: Aadhaar, PAN, business registration\n3. **Apply Online**: Most schemes have online portals\n4. **Submit Documents**: Upload required proofs\n5. **Track Status**: Monitor application progress\n\n💡 **Tip**: Register on Udyam portal first for easy access to all schemes.`,
        keywords: ["apply", "application", "register", "enroll", "submit"]
      }
    ];
  }

  private generateLoanAnswer(schemes: ProcessedScheme[]): string {
    const loanSchemes = schemes.filter((s: any) =>
      s.category === 'loan' || s.category === 'credit'
    ).slice(0, 3);

    let answer = `Popular loan schemes for MSMEs:\n\n`;

    loanSchemes.forEach(scheme => {
      answer += `**${scheme.name}**\n`;
      if (scheme.financialDetails?.loanAmount?.max) {
        answer += `• Max Amount: ₹${this.formatAmount(scheme.financialDetails.loanAmount.max)}\n`;
      }
      answer += `• ${scheme.summary}\n\n`;
    });

    answer += `📌 **Quick Tip**: CGTMSE scheme provides collateral-free loans up to ₹5 crore!`;
    return answer;
  }

  private generatePMEGPAnswer(schemes: ProcessedScheme[]): string {
    const pmegp = schemes.find(s => s.name.includes('PMEGP'));
    if (!pmegp) return 'PMEGP information is currently unavailable offline.';

    return `**Prime Minister's Employment Generation Programme (PMEGP)**\n\n${pmegp.summary}\n\n**Key Benefits**:\n• Subsidy up to 35% in rural areas\n• Subsidy up to 25% in urban areas\n• No collateral required\n• Maximum project cost: ₹25 lakhs (manufacturing)\n\n**Who can apply**: Any individual above 18 years with minimum 8th pass education`;
  }

  private generateWomenSchemeAnswer(schemes: ProcessedScheme[]): string {
    const womenSchemes = schemes.filter(s =>
      s.targetAudience.some(a => a.toLowerCase().includes('women'))
    ).slice(0, 3);

    let answer = `Special benefits for women entrepreneurs:\n\n`;

    if (womenSchemes.length > 0) {
      womenSchemes.forEach(scheme => {
        answer += `**${scheme.name}**\n• ${scheme.summary}\n\n`;
      });
    }

    answer += `💡 **Special Benefits**:\n• 5-10% higher subsidy rates\n• Lower interest rates on loans\n• Priority in application processing\n• Dedicated helpline support`;

    return answer;
  }

  /**
   * Get offline response for a query
   */
  public getOfflineResponse(query: string): string {
    const queryLower = query.toLowerCase();

    // Check common questions
    if (this.cache?.commonQuestions) {
      for (const qa of this.cache.commonQuestions) {
        const hasKeyword = qa.keywords.some(keyword =>
          queryLower.includes(keyword.toLowerCase())
        );
        if (hasKeyword) {
          return this.formatOfflineResponse(qa.answer);
        }
      }
    }

    // Search in schemes
    const relevantSchemes = schemeDataService.searchSchemes(query).slice(0, 3);

    if (relevantSchemes.length > 0) {
      let response = `Found ${relevantSchemes.length} relevant schemes:\n\n`;
      relevantSchemes.forEach(scheme => {
        response += `**${scheme.name}**\n`;
        response += `• ${scheme.summary}\n`;
        response += `• Category: ${scheme.category}\n\n`;
      });
      return this.formatOfflineResponse(response);
    }

    // Default offline response
    return this.formatOfflineResponse(
      `I'm currently in offline mode and have limited information available.\n\n` +
      `I can help you with:\n` +
      `• Information about ${this.cache?.schemes.length || 0} government schemes\n` +
      `• Eligibility criteria and benefits\n` +
      `• Basic application guidance\n\n` +
      `For detailed assistance, please connect to the internet.`
    );
  }

  /**
   * Format response with offline indicator
   */
  private formatOfflineResponse(content: string): string {
    return `📵 *Offline Mode*\n\n${content}\n\n---\n*Note: This information is from cached data. Connect online for latest updates.*`;
  }

  /**
   * Sync data when back online
   */
  private async syncData(): Promise<void> {
    try {
      // In a real app, this would fetch latest schemes from API
      this.updateCache();
      console.log('✅ Data synced successfully');
    } catch (error) {
      console.error('Failed to sync data:', error);
    }
  }

  /**
   * Check if specific API endpoint is reachable
   */
  public async checkAPIHealth(endpoint: string = '/api/health'): Promise<boolean> {
    if (!this.isOnline) return false;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const response = await fetch(endpoint, {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.warn('API health check failed:', error);
      return false;
    }
  }

  /**
   * Get network status
   */
  public getNetworkStatus(): {
    isOnline: boolean;
    cacheAge: number | null;
    schemesCount: number;
  } {
    return {
      isOnline: this.isOnline,
      cacheAge: this.cache ?
        Math.floor((Date.now() - this.cache.lastUpdated.getTime()) / 1000 / 60) : // minutes
        null,
      schemesCount: this.cache?.schemes.length || 0
    };
  }

  /**
   * Subscribe to network status changes
   */
  public onNetworkChange(callback: (online: boolean) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(online: boolean): void {
    this.listeners.forEach(callback => callback(online));
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
}

// Export singleton instance
export const offlineService = OfflineService.getInstance();
/**
 * React Hook for Offline Mode
 * Provides network status and offline functionality to components
 */

import { useState, useEffect, useCallback } from 'react';
import { offlineService } from '@/services/offline/offlineService';
import { toast } from 'sonner';

export interface OfflineStatus {
  isOnline: boolean;
  isAPIAvailable: boolean;
  cacheAge: number | null;
  schemesCount: number;
}

export function useOfflineMode() {
  const [status, setStatus] = useState<OfflineStatus>({
    isOnline: true,
    isAPIAvailable: true,
    cacheAge: null,
    schemesCount: 0
  });
  const [isChecking, setIsChecking] = useState(false);

  // Update status from offline service
  const updateStatus = useCallback(() => {
    const networkStatus = offlineService.getNetworkStatus();
    setStatus(prev => ({
      ...prev,
      ...networkStatus
    }));
  }, []);

  // Check API availability
  const checkAPIAvailability = useCallback(async () => {
    if (!status.isOnline) {
      setStatus(prev => ({ ...prev, isAPIAvailable: false }));
      return false;
    }

    setIsChecking(true);
    try {
      const isAvailable = await offlineService.checkAPIHealth();
      setStatus(prev => ({ ...prev, isAPIAvailable: isAvailable }));
      return isAvailable;
    } finally {
      setIsChecking(false);
    }
  }, [status.isOnline]);

  // Get offline response for a query
  const getOfflineResponse = useCallback((query: string) => {
    return offlineService.getOfflineResponse(query);
  }, []);

  // Setup network listeners
  useEffect(() => {
    // Initial status
    updateStatus();

    // Check API on mount
    checkAPIAvailability();

    // Subscribe to network changes
    const unsubscribe = offlineService.onNetworkChange((online) => {
      updateStatus();

      if (online) {
        toast.success('Back online! Syncing data...', {
          duration: 3000,
          position: 'top-center'
        });
        checkAPIAvailability();
      } else {
        toast.warning('You are offline. Using cached data.', {
          duration: 5000,
          position: 'top-center',
          action: {
            label: 'Dismiss',
            onClick: () => {}
          }
        });
      }
    });

    // Check API health periodically when online
    const interval = setInterval(() => {
      if (status.isOnline) {
        checkAPIAvailability();
      }
    }, 30000); // Every 30 seconds

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  // Refresh cache
  const refreshCache = useCallback(() => {
    offlineService.updateCache();
    updateStatus();
    toast.success('Offline cache updated', {
      duration: 2000
    });
  }, [updateStatus]);

  return {
    status,
    isChecking,
    getOfflineResponse,
    checkAPIAvailability,
    refreshCache,
    isOfflineMode: !status.isOnline || !status.isAPIAvailable
  };
}

/**
 * Hook for displaying network status indicator
 */
export function useNetworkIndicator() {
  const { status, isOfflineMode } = useOfflineMode();

  const getIndicatorProps = () => {
    if (!status.isOnline) {
      return {
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
        icon: '📵',
        text: 'Offline',
        description: 'Using cached data'
      };
    }

    if (!status.isAPIAvailable) {
      return {
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500/10',
        icon: '⚠️',
        text: 'Limited',
        description: 'API unavailable'
      };
    }

    return {
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      icon: '✅',
      text: 'Online',
      description: 'All systems operational'
    };
  };

  return {
    isOfflineMode,
    indicatorProps: getIndicatorProps(),
    cacheInfo: status.cacheAge !== null ? {
      age: status.cacheAge,
      ageText: status.cacheAge > 60 ?
        `${Math.floor(status.cacheAge / 60)} hours ago` :
        `${status.cacheAge} minutes ago`,
      schemesCount: status.schemesCount
    } : null
  };
}
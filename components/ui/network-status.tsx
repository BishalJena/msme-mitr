/**
 * Network Status Indicator Component
 * Shows online/offline status and cache information
 */

"use client";

import React from 'react';
import { useNetworkIndicator } from '@/hooks/useOfflineMode';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Wifi, WifiOff, CloudOff, RefreshCw, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export function NetworkStatusIndicator() {
  const { isOfflineMode, indicatorProps, cacheInfo } = useNetworkIndicator();

  if (!isOfflineMode) {
    // Only show when offline or API unavailable
    return null;
  }

  return (
    <div className="fixed top-16 right-4 z-50">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`${indicatorProps.bgColor} ${indicatorProps.color} border border-current/20 hover:border-current/40`}
          >
            <span className="mr-2">{indicatorProps.icon}</span>
            <span className="font-medium">{indicatorProps.text}</span>
            <Info className="ml-2 w-3 h-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Network Status</h4>
              {indicatorProps.text === 'Offline' ? (
                <WifiOff className="w-4 h-4 text-red-500" />
              ) : indicatorProps.text === 'Limited' ? (
                <CloudOff className="w-4 h-4 text-yellow-500" />
              ) : (
                <Wifi className="w-4 h-4 text-green-500" />
              )}
            </div>

            <div className="text-sm text-muted-foreground">
              {indicatorProps.description}
            </div>

            {cacheInfo && (
              <Card className="p-3 bg-muted/50">
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cached schemes:</span>
                    <span className="font-medium">{cacheInfo.schemesCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last updated:</span>
                    <span className="font-medium">{cacheInfo.ageText}</span>
                  </div>
                </div>
              </Card>
            )}

            <div className="pt-2 space-y-2">
              <p className="text-xs text-muted-foreground">
                {isOfflineMode ?
                  "You can still browse schemes and get basic information using cached data." :
                  "All features are available with live data."
                }
              </p>

              {isOfflineMode && (
                <div className="bg-yellow-50 dark:bg-yellow-950/20 rounded-md p-2">
                  <p className="text-xs text-yellow-700 dark:text-yellow-400">
                    💡 Some features like real-time AI responses may be limited.
                  </p>
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

/**
 * Compact network status badge
 */
export function NetworkStatusBadge() {
  const { isOfflineMode, indicatorProps } = useNetworkIndicator();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={isOfflineMode ? "destructive" : "default"}
            className="cursor-help"
          >
            {indicatorProps.icon}
            <span className="ml-1">{indicatorProps.text}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{indicatorProps.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Full network status banner
 */
export function NetworkStatusBanner() {
  const { isOfflineMode, indicatorProps, cacheInfo } = useNetworkIndicator();
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    // Reset dismissed state when network status changes
    setDismissed(false);
  }, [isOfflineMode]);

  if (!isOfflineMode || dismissed) {
    return null;
  }

  return (
    <div className={`${indicatorProps.bgColor} ${indicatorProps.color} px-4 py-2 border-b border-current/20`}>
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg">{indicatorProps.icon}</span>
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
            <span className="font-medium">{indicatorProps.text} Mode</span>
            <span className="text-sm opacity-80">• {indicatorProps.description}</span>
            {cacheInfo && (
              <span className="text-sm opacity-80">
                • {cacheInfo.schemesCount} schemes available offline
              </span>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDismissed(true)}
          className="text-current hover:bg-current/10"
        >
          Dismiss
        </Button>
      </div>
    </div>
  );
}

/**
 * Offline mode message for chat
 */
export function OfflineModeMessage() {
  const { isOfflineMode, cacheInfo } = useNetworkIndicator();

  if (!isOfflineMode) return null;

  return (
    <Card className="mx-4 mb-4 p-3 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900">
      <div className="flex items-start gap-2">
        <WifiOff className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
        <div className="flex-1 space-y-1">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
            Offline Mode Active
          </p>
          <p className="text-xs text-yellow-700 dark:text-yellow-400">
            Using cached data with {cacheInfo?.schemesCount || 0} schemes.
            Responses may be limited.
          </p>
          {cacheInfo && (
            <p className="text-xs text-yellow-600 dark:text-yellow-500">
              Last updated {cacheInfo.ageText}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
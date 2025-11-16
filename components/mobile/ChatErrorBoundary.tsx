"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { getUserFriendlyErrorMessage } from '@/lib/utils';

interface Props {
  children: ReactNode;
  language?: string;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component for ChatInterfaceStream
 * Catches React errors and displays a user-friendly error UI
 */
export class ChatErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console for debugging
    console.error('ChatErrorBoundary caught an error:', error, errorInfo);
    
    // Update state with error info
    this.setState({
      errorInfo,
    });
    
    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    const { hasError, error } = this.state;
    const { children, language = 'en', fallback } = this.props;
    const isHindi = language === 'hi';

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default error UI
      const userFriendlyMessage = getUserFriendlyErrorMessage(error, language);

      return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-background">
          <Card className="max-w-md w-full border-destructive/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0" aria-hidden="true" />
                <CardTitle className="text-destructive">
                  {isHindi ? 'कुछ गलत हो गया' : 'Something went wrong'}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {userFriendlyMessage}
              </p>
              {process.env.NODE_ENV === 'development' && error && (
                <details className="mt-4 p-3 bg-muted rounded-md text-xs">
                  <summary className="cursor-pointer font-medium mb-2">
                    Technical Details (Dev Only)
                  </summary>
                  <pre className="whitespace-pre-wrap break-words">
                    {error.toString()}
                  </pre>
                </details>
              )}
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button
                onClick={this.handleReset}
                className="flex-1"
                variant="outline"
                aria-label={isHindi ? 'पुनः प्रयास करें' : 'Try again'}
              >
                <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
                {isHindi ? 'पुनः प्रयास करें' : 'Try Again'}
              </Button>
              <Button
                onClick={this.handleReload}
                className="flex-1"
                aria-label={isHindi ? 'पेज रीलोड करें' : 'Reload page'}
              >
                {isHindi ? 'पेज रीलोड करें' : 'Reload Page'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return children;
  }
}

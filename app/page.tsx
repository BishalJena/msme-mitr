/**
 * Root Landing Page
 * 
 * This page is handled by middleware:
 * - Authenticated users are redirected to /chat
 * - Unauthenticated users are redirected to /login
 * 
 * This component should never actually render, but we provide
 * a loading state just in case.
 */

export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}

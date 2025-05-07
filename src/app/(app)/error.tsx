'use client'; 

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App Route Group Error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center p-4 h-full"> 
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="items-center text-center">
          <div className="p-2 bg-destructive/10 rounded-full inline-block">
             <AlertTriangle className="w-10 h-10 text-destructive" />
          </div>
          <CardTitle className="text-xl font-semibold mt-3 text-destructive">Page Load Error</CardTitle>
          <CardDescription className="text-muted-foreground">
            Sorry, we couldn't load this page properly.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-foreground">
            An error occurred while trying to display this content. You can try refreshing the page.
          </p>
           {error?.message && (
            <details className="mt-3 p-2 bg-muted rounded-md text-left text-xs max-h-32 overflow-y-auto">
              <summary className="cursor-pointer font-medium">Error Information</summary>
              <pre className="mt-1 whitespace-pre-wrap break-all">{error.message}</pre>
              {error.digest && <p className="mt-1">Digest: {error.digest}</p>}
            </details>
          )}
        </CardContent>
        <CardFooter>
          <Button
            onClick={() => reset()}
            variant="default"
            size="lg"
            className="w-full"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh Page
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
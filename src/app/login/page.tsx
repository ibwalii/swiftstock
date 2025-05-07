'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/app/logo';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { login, isLoggedIn, isLoadingAuth } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('user@example.com'); // Default for demo
  const [password, setPassword] = useState('password'); // Default for demo
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientSideReady, setClientSideReady] = useState(false);

  useEffect(() => {
    // Ensures this runs only on client after hydration
    setClientSideReady(true);
  }, []);

  useEffect(() => {
    if (clientSideReady && !isLoadingAuth && isLoggedIn) {
      router.replace('/pos');
    }
  }, [isLoggedIn, isLoadingAuth, router, clientSideReady]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Mock login validation
    if (email === 'user@example.com' && password === 'password') {
      await login(); // login already handles redirection
    } else {
      setError('Invalid email or password.');
    }
    setIsSubmitting(false);
  };

  if (!clientSideReady || isLoadingAuth || (clientSideReady && !isLoadingAuth && isLoggedIn && typeof window !== 'undefined' && window.location.pathname !== '/login')) {
    // Show loader if not client-side ready, or auth is loading,
    // or if logged in and not already on /login (to prevent flicker during redirect)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading SwiftStock...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 selection:bg-primary/20">
      <Card className="w-full max-w-sm shadow-xl border-border">
        <CardHeader className="items-center text-center space-y-3 pt-8">
          <Logo />
          <CardTitle className="text-3xl font-bold tracking-tight">Welcome Back!</CardTitle>
          <CardDescription>Sign in to manage your sales and inventory.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="text-base"
              />
            </div>
            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
            <Button type="submit" className="w-full text-base py-6" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center justify-center text-xs text-muted-foreground pb-8 pt-4">
          <p>For demo purposes:</p>
          <p>Email: user@example.com / Password: password</p>
        </CardFooter>
      </Card>
       <p className="mt-8 text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} SwiftStock. All rights reserved.
      </p>
    </div>
  );
}

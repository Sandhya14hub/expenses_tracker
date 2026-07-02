'use client';

import Link from 'next/link';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex items-center justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-500">
            <span className="text-3xl font-bold text-white">404</span>
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Page not found</h1>
          <p className="text-sm text-muted-foreground">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/dashboard"><Home className="h-4 w-4" />Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}

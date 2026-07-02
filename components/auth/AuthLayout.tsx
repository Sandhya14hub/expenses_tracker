'use client';

import Link from 'next/link';
import { Wallet } from 'lucide-react';
import { ReactNode } from 'react';

export function AuthLayout({ children, title, subtitle }: { children: ReactNode; title: string; subtitle: string }) {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 80%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
              <Wallet className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold">FinTrack</span>
          </Link>
          <div className="space-y-6">
            <h2 className="text-4xl font-bold leading-tight">Take control of your financial future.</h2>
            <p className="text-lg text-white/80 max-w-md">
              Track expenses, set budgets, monitor goals, and get AI-powered insights — all in one beautiful dashboard.
            </p>
            <div className="grid grid-cols-3 gap-4 max-w-md">
              {[
                { label: 'Expenses tracked', value: '$2.4M+' },
                { label: 'Active users', value: '50K+' },
                { label: 'Goals achieved', value: '120K+' },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-white/70">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="text-sm text-white/60">© 2024 FinTrack. All rights reserved.</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden flex items-center gap-2 justify-center mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold">FinTrack</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wallet } from 'lucide-react';
import { NAV_ITEMS } from '@/utils/constants';
import { NavIcon } from '@/components/common/NavIcon';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r bg-card h-screen sticky top-0">
      <div className="flex items-center gap-2 px-6 h-16 border-b">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500">
          <Wallet className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-bold tracking-tight">FinTrack</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <NavIcon name={item.icon} className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <div className="rounded-lg bg-gradient-to-br from-indigo-500/10 to-blue-500/10 p-4">
          <p className="text-xs font-medium text-muted-foreground">Need help?</p>
          <p className="text-sm font-semibold mt-1">Check our docs</p>
          <Link href="/settings" className="text-xs text-indigo-600 hover:underline mt-2 inline-block">
            View settings →
          </Link>
        </div>
      </div>
    </aside>
  );
}

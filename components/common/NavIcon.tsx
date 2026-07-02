'use client';

import {
  LayoutDashboard, TrendingUp, TrendingDown, Tags, Wallet, Target,
  Receipt, BarChart3, FileText, CreditCard, Banknote, Bell,
  Settings, User, type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard, TrendingUp, TrendingDown, Tags, Wallet, Target,
  Receipt, BarChart3, FileText, CreditCard, Banknote, Bell,
  Settings, User,
};

export function NavIcon({ name, className }: { name: string; className?: string }) {
  const Icon = iconMap[name] || LayoutDashboard;
  return <Icon className={className} />;
}

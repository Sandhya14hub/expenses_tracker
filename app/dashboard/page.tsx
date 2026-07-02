'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp, TrendingDown, Wallet, PiggyBank, Target,
  Receipt, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useAuth } from '@/context/AuthContext';
import { fetchDashboardData, fetchMonthlyTrend } from '@/lib/dashboard.service';
import { ProtectedRoute } from '@/components/routes/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SkeletonCard } from '@/components/common/SkeletonCard';
import { ErrorState } from '@/components/common/ErrorState';
import { formatCurrency, formatCompactCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import type { DashboardStats, Income, Expense, Goal, Bill } from '@/types';

function StatCard({ icon: Icon, label, value, trend, color }: {
  icon: React.ElementType; label: string; value: string; trend?: number; color: string;
}) {
  return (
    <Card className="card-hover">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
          {trend !== undefined && (
            <span className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(trend).toFixed(1)}%
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}

function DashboardContent() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [income, setIncome] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [expenseByCategory, setExpenseByCategory] = useState<{ name: string; value: number; color: string }[]>([]);
  const [trend, setTrend] = useState<{ month: string; income: number; expense: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const currency = profile?.currency || 'USD';

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    setError(false);
    try {
      const data = await fetchDashboardData();
      setStats(data.stats);
      setIncome(data.income);
      setExpenses(data.expenses);
      setGoals(data.goals);
      setBills(data.bills);
      setExpenseByCategory(data.expenseByCategory);
      const trendData = await fetchMonthlyTrend();
      setTrend(trendData);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); /* eslint-disable-next-line */ }, [user]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Welcome back, {profile?.full_name || 'User'}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState onRetry={loadData} />;
  }

  const recentTransactions = [
    ...income.map((i) => ({ ...i, type: 'income' as const })),
    ...expenses.map((e) => ({ ...e, type: 'expense' as const })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Welcome back, {profile?.full_name || 'User'}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={TrendingUp} label="Total Income" value={formatCurrency(stats?.totalIncome || 0, currency)} color="bg-green-100 text-green-600 dark:bg-green-950/30 dark:text-green-400" />
        <StatCard icon={TrendingDown} label="Total Expense" value={formatCurrency(stats?.totalExpense || 0, currency)} color="bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400" />
        <StatCard icon={Wallet} label="Balance" value={formatCurrency(stats?.balance || 0, currency)} color="bg-blue-100 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400" />
        <StatCard icon={PiggyBank} label="Monthly Savings" value={formatCurrency(stats?.monthlySavings || 0, currency)} color="bg-indigo-100 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Income vs Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 12 }} />
                <YAxis className="text-xs" tick={{ fontSize: 12 }} tickFormatter={(v) => formatCompactCurrency(v, currency)} />
                <Tooltip formatter={(v: number) => formatCurrency(v, currency)} contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }} />
                <Legend />
                <Area type="monotone" dataKey="income" stroke="#22c55e" fill="url(#incGrad)" strokeWidth={2} name="Income" />
                <Area type="monotone" dataKey="expense" stroke="#ef4444" fill="url(#expGrad)" strokeWidth={2} name="Expense" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Expense by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {expenseByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={expenseByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2}>
                    {expenseByCategory.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v, currency)} contentStyle={{ borderRadius: '8px' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-sm text-muted-foreground">
                No expense data this month
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {recentTransactions.map((t) => (
                  <div key={t.id} className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${t.type === 'income' ? 'bg-green-100 text-green-600 dark:bg-green-950/30' : 'bg-red-100 text-red-600 dark:bg-red-950/30'}`}>
                      {t.type === 'income' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{t.description || (t.type === 'expense' ? (t as Expense).merchant : (t as Income).source) || 'Transaction'}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(t.date)}</p>
                    </div>
                    <span className={`text-sm font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(Number(t.amount), currency)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No transactions yet this month</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-4 w-4" /> Upcoming Bills
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bills.length > 0 ? (
              <div className="space-y-3">
                {bills.slice(0, 4).map((bill) => (
                  <div key={bill.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{bill.name}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(bill.due_date)}</p>
                    </div>
                    <span className="text-sm font-semibold">{formatCurrency(Number(bill.amount), currency)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No upcoming bills</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" /> Active Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            {goals.length > 0 ? (
              <div className="space-y-4">
                {goals.slice(0, 3).map((goal) => {
                  const pct = goal.target_amount > 0 ? Math.min((Number(goal.current_amount) / Number(goal.target_amount)) * 100, 100) : 0;
                  return (
                    <div key={goal.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{goal.name}</span>
                        <span className="text-xs text-muted-foreground">{pct.toFixed(0)}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
                <Link href="/goals" className="text-xs text-indigo-600 hover:underline">View all goals →</Link>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No active goals</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Budget Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Used this month</span>
                <span className="text-sm font-semibold">{formatCurrency(stats?.totalExpense || 0, currency)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total budget</span>
                <span className="text-sm font-semibold">{formatCurrency(stats?.budgetLimit || 0, currency)}</span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${(stats?.budgetUsage || 0) > 90 ? 'bg-red-500' : 'bg-gradient-to-r from-indigo-500 to-blue-500'}`}
                  style={{ width: `${stats?.budgetUsage || 0}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {stats?.budgetUsage !== undefined ? stats.budgetUsage.toFixed(0) : 0}% of budget used
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <DashboardContent />
      </AppLayout>
    </ProtectedRoute>
  );
}

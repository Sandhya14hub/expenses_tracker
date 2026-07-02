'use client';

import { useEffect, useState, useCallback } from 'react';
import { FileText, Download, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { incomeService, expenseService } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/routes/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorState } from '@/components/common/ErrorState';
import { SkeletonCard } from '@/components/common/SkeletonCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/utils/formatCurrency';
import { exportToCSV } from '@/utils/export';
import { toast } from 'sonner';
import type { Income, Expense } from '@/types';

function ReportsContent() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [period, setPeriod] = useState('month');
  const [income, setIncome] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const currency = profile?.currency || 'USD';

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const now = new Date();
      let start: Date;
      if (period === 'week') start = new Date(now.getTime() - 7 * 86400000);
      else if (period === 'month') start = new Date(now.getFullYear(), now.getMonth(), 1);
      else if (period === 'quarter') start = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      else start = new Date(now.getFullYear(), 0, 1);
      const [incomeAll, expensesAll] = await Promise.all([
        incomeService.list(),
        expenseService.list(),
      ]);
      const startStr = start.toISOString();
      setIncome(((incomeAll as Income[]) || []).filter((i) => i.date >= startStr));
      setExpenses(((expensesAll as Expense[]) || []).filter((e) => e.date >= startStr));
    } catch { setError(true); }
    setLoading(false);
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const totalIncome = income.reduce((s, i) => s + Number(i.amount), 0);
  const totalExpense = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const balance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;

  const handleExportIncome = () => { if (!income.length) { toast.error('No data to export'); return; } exportToCSV(income.map((i) => ({ date: i.date, description: i.description, source: i.source, category: i.category?.name, amount: i.amount })), 'income-report.csv'); toast.success('Exported income report'); };
  const handleExportExpenses = () => { if (!expenses.length) { toast.error('No data to export'); return; } exportToCSV(expenses.map((e) => ({ date: e.date, description: e.description, merchant: e.merchant, category: e.category?.name, amount: e.amount })), 'expense-report.csv'); toast.success('Exported expense report'); };

  return (
    <div>
      <PageHeader title="Reports" description="Generate and export financial reports" action={<Select value={period} onValueChange={setPeriod}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="week">This Week</SelectItem><SelectItem value="month">This Month</SelectItem><SelectItem value="quarter">This Quarter</SelectItem><SelectItem value="year">This Year</SelectItem></SelectContent></Select>} />
      {loading ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}</div> :
       error ? <ErrorState onRetry={load} /> :
       <div className="space-y-6">
         <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
           <Card><CardContent className="p-5"><div className="flex items-center gap-3 mb-2"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-600 dark:bg-green-950/30"><TrendingUp className="h-5 w-5" /></div><p className="text-sm text-muted-foreground">Total Income</p></div><p className="text-2xl font-bold">{formatCurrency(totalIncome, currency)}</p></CardContent></Card>
           <Card><CardContent className="p-5"><div className="flex items-center gap-3 mb-2"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950/30"><TrendingDown className="h-5 w-5" /></div><p className="text-sm text-muted-foreground">Total Expense</p></div><p className="text-2xl font-bold">{formatCurrency(totalExpense, currency)}</p></CardContent></Card>
           <Card><CardContent className="p-5"><div className="flex items-center gap-3 mb-2"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/30"><Wallet className="h-5 w-5" /></div><p className="text-sm text-muted-foreground">Net Balance</p></div><p className="text-2xl font-bold">{formatCurrency(balance, currency)}</p></CardContent></Card>
           <Card><CardContent className="p-5"><div className="flex items-center gap-3 mb-2"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950/30"><FileText className="h-5 w-5" /></div><p className="text-sm text-muted-foreground">Savings Rate</p></div><p className="text-2xl font-bold">{savingsRate.toFixed(1)}%</p></CardContent></Card>
         </div>
         <div className="grid gap-4 lg:grid-cols-2">
           <Card>
             <CardHeader><div className="flex items-center justify-between"><CardTitle className="text-base">Income Report</CardTitle><Button variant="outline" size="sm" onClick={handleExportIncome} className="gap-2"><Download className="h-4 w-4" />Export CSV</Button></div></CardHeader>
             <CardContent><p className="text-sm text-muted-foreground mb-2">{income.length} transactions</p><div className="space-y-2 max-h-64 overflow-y-auto">{income.slice(0, 10).map((i) => <div key={i.id} className="flex justify-between text-sm"><span>{i.description || i.source || 'Income'}</span><span className="font-medium text-green-600">{formatCurrency(Number(i.amount), currency)}</span></div>)}</div></CardContent>
           </Card>
           <Card>
             <CardHeader><div className="flex items-center justify-between"><CardTitle className="text-base">Expense Report</CardTitle><Button variant="outline" size="sm" onClick={handleExportExpenses} className="gap-2"><Download className="h-4 w-4" />Export CSV</Button></div></CardHeader>
             <CardContent><p className="text-sm text-muted-foreground mb-2">{expenses.length} transactions</p><div className="space-y-2 max-h-64 overflow-y-auto">{expenses.slice(0, 10).map((e) => <div key={e.id} className="flex justify-between text-sm"><span>{e.description || e.merchant || 'Expense'}</span><span className="font-medium text-red-600">{formatCurrency(Number(e.amount), currency)}</span></div>)}</div></CardContent>
           </Card>
         </div>
       </div>}
    </div>
  );
}

export default function ReportsPage() {
  return <ProtectedRoute><AppLayout><ReportsContent /></AppLayout></ProtectedRoute>;
}

'use client';

import { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { incomeService, expenseService, categoryService } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/routes/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorState } from '@/components/common/ErrorState';
import { SkeletonCard } from '@/components/common/SkeletonCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, formatCompactCurrency } from '@/utils/formatCurrency';
import { getMonthName } from '@/utils/formatDate';
import type { Income, Expense, Category } from '@/types';

function AnalyticsContent() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [monthlyData, setMonthlyData] = useState<{ month: string; income: number; expense: number; savings: number }[]>([]);
  const [categoryData, setCategoryData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [dailyTrend, setDailyTrend] = useState<{ day: string; amount: number }[]>([]);
  const currency = profile?.currency || 'USD';

  useEffect(() => {
    setLoading(true); setError(false);
    (async () => {
      try {
        const start = new Date(year, 0, 1).toISOString();
        const end = new Date(year, 11, 31).toISOString();
        const [incomeAll, expensesAll, categoriesAll] = await Promise.all([
          incomeService.list(),
          expenseService.list(),
          categoryService.list(),
        ]);
        const income = ((incomeAll as Income[]) || []).filter((x) => x.date >= start && x.date <= end);
        const expenses = ((expensesAll as Expense[]) || []).filter((x) => x.date >= start && x.date <= end);
        const categories = ((categoriesAll as Category[]) || []).filter((c) => c.type === 'expense');

        const months = Array.from({ length: 12 }, (_, i) => {
          const mIncome = income.filter((x) => new Date(x.date).getMonth() === i).reduce((s, x) => s + Number(x.amount), 0);
          const mExpense = expenses.filter((x) => new Date(x.date).getMonth() === i).reduce((s, x) => s + Number(x.amount), 0);
          return { month: getMonthName(i), income: mIncome, expense: mExpense, savings: mIncome - mExpense };
        });
        setMonthlyData(months);

        const catBreakdown = categories.map((c) => ({
          name: c.name, color: c.color,
          value: expenses.filter((e) => e.category_id === c.id).reduce((s, e) => s + Number(e.amount), 0),
        })).filter((c) => c.value > 0);
        setCategoryData(catBreakdown);

        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const days: { day: string; amount: number }[] = [];
        for (let d = 0; d < 30; d++) {
          const date = new Date(monthStart.getTime() + d * 86400000);
          if (date > now) break;
          const amt = expenses.filter((e) => new Date(e.date).toDateString() === date.toDateString()).reduce((s, e) => s + Number(e.amount), 0);
          days.push({ day: `${date.getMonth() + 1}/${date.getDate()}`, amount: amt });
        }
        setDailyTrend(days);
      } catch { setError(true); }
      finally { setLoading(false); }
    })();
  }, [year]);

  return (
    <div>
      <PageHeader title="Analytics" description="Deep dive into your financial patterns" action={<Select value={String(year)} onValueChange={(v) => setYear(Number(v))}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger><SelectContent>{[new Date().getFullYear(), new Date().getFullYear() - 1].map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent></Select>} />
      {loading ? <div className="grid gap-4 lg:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}</div> :
       error ? <ErrorState onRetry={() => window.location.reload()} /> :
       <div className="space-y-6">
         <div className="grid gap-4 lg:grid-cols-2">
           <Card>
             <CardHeader><CardTitle className="text-base">Monthly Overview — {year}</CardTitle></CardHeader>
             <CardContent>
               <ResponsiveContainer width="100%" height={300}>
                 <BarChart data={monthlyData}>
                   <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                   <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                   <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatCompactCurrency(v, currency)} />
                   <Tooltip formatter={(v: number) => formatCurrency(v, currency)} contentStyle={{ borderRadius: '8px' }} />
                   <Legend />
                   <Bar dataKey="income" fill="#22c55e" name="Income" radius={[4, 4, 0, 0]} />
                   <Bar dataKey="expense" fill="#ef4444" name="Expense" radius={[4, 4, 0, 0]} />
                 </BarChart>
               </ResponsiveContainer>
             </CardContent>
           </Card>
           <Card>
             <CardHeader><CardTitle className="text-base">Savings Trend</CardTitle></CardHeader>
             <CardContent>
               <ResponsiveContainer width="100%" height={300}>
                 <LineChart data={monthlyData}>
                   <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                   <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                   <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatCompactCurrency(v, currency)} />
                   <Tooltip formatter={(v: number) => formatCurrency(v, currency)} contentStyle={{ borderRadius: '8px' }} />
                   <Line type="monotone" dataKey="savings" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} name="Savings" />
                 </LineChart>
               </ResponsiveContainer>
             </CardContent>
           </Card>
         </div>
         <div className="grid gap-4 lg:grid-cols-2">
           <Card>
             <CardHeader><CardTitle className="text-base">Category Breakdown</CardTitle></CardHeader>
             <CardContent>
               {categoryData.length > 0 ? (
                 <ResponsiveContainer width="100%" height={300}>
                   <PieChart>
                     <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                       {categoryData.map((e, i) => <Cell key={i} fill={e.color} />)}
                     </Pie>
                     <Tooltip formatter={(v: number) => formatCurrency(v, currency)} contentStyle={{ borderRadius: '8px' }} />
                     <Legend />
                   </PieChart>
                 </ResponsiveContainer>
               ) : <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">No data for {year}</div>}
             </CardContent>
           </Card>
           <Card>
             <CardHeader><CardTitle className="text-base">Daily Spending (This Month)</CardTitle></CardHeader>
             <CardContent>
               <ResponsiveContainer width="100%" height={300}>
                 <BarChart data={dailyTrend}>
                   <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                   <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                   <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatCompactCurrency(v, currency)} />
                   <Tooltip formatter={(v: number) => formatCurrency(v, currency)} contentStyle={{ borderRadius: '8px' }} />
                   <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} name="Spending" />
                 </BarChart>
               </ResponsiveContainer>
             </CardContent>
           </Card>
         </div>
       </div>}
    </div>
  );
}

export default function AnalyticsPage() {
  return <ProtectedRoute><AppLayout><AnalyticsContent /></AppLayout></ProtectedRoute>;
}

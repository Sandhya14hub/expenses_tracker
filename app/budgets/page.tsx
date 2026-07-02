'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Wallet, Pencil, Trash2 } from 'lucide-react';
import { budgetService, categoryService, expenseService } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/routes/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { SkeletonCard } from '@/components/common/SkeletonCard';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PERIOD_OPTIONS } from '@/utils/constants';
import { formatCurrency } from '@/utils/formatCurrency';
import { toast } from 'sonner';
import type { Budget, Category, Expense } from '@/types';

function BudgetsContent() {
  const { profile } = useAuth();
  const [budgets, setBudgets] = useState<(Budget & { spent?: number })[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', limit_amount: '', period: 'monthly', category_id: '', start_date: new Date().toISOString().split('T')[0] });
  const currency = profile?.currency || 'USD';

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const [budData, catData, expData] = await Promise.all([
        budgetService.list(),
        categoryService.list(),
        expenseService.list(),
      ]);
      const buds = (budData as Budget[]) || [];
      const expenses = (expData as Expense[]) || [];
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const withSpent = buds.map((b) => {
        const spent = expenses.filter((e) => e.category_id === b.category_id && e.date >= monthStart).reduce((s, e) => s + Number(e.amount), 0);
        return { ...b, spent };
      });
      setBudgets(withSpent);
      const expenseCats = ((catData as Category[]) || []).filter((c) => c.type === 'expense');
      setCategories(expenseCats);
    } catch {
      setError(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditId(null); setForm({ name: '', limit_amount: '', period: 'monthly', category_id: '', start_date: new Date().toISOString().split('T')[0] }); setDialogOpen(true); };
  const openEdit = (b: Budget) => { setEditId(b.id); setForm({ name: b.name, limit_amount: String(b.limit_amount), period: b.period, category_id: b.category_id || '', start_date: b.start_date }); setDialogOpen(true); };

  const onSave = async () => {
    if (!form.name.trim() || !form.limit_amount) { toast.error('Fill all required fields'); return; }
    try {
      if (editId) {
        await budgetService.update(editId, { name: form.name, limit_amount: Number(form.limit_amount), period: form.period as 'weekly' | 'monthly' | 'yearly', category_id: form.category_id || null, start_date: form.start_date });
        toast.success('Budget updated');
      } else {
        await budgetService.create({ name: form.name, limit_amount: Number(form.limit_amount), period: form.period as 'weekly' | 'monthly' | 'yearly', category_id: form.category_id || null, start_date: form.start_date });
        toast.success('Budget created');
      }
      setDialogOpen(false); load();
    } catch (e: any) {
      toast.error(e?.message || 'Something went wrong');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await budgetService.remove(deleteId);
      setBudgets((prev) => prev.filter((b) => b.id !== deleteId));
      toast.success('Budget deleted');
      setDeleteId(null);
    } catch (e: any) {
      toast.error(e?.message || 'Something went wrong');
    }
  };

  return (
    <div>
      <PageHeader title="Budgets" description="Set spending limits and track progress" action={<Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Add Budget</Button>} />
      {loading ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div> :
       error ? <ErrorState onRetry={load} /> :
       budgets.length === 0 ? <EmptyState icon={Wallet} title="No budgets yet" description="Create a budget to control your spending" action={<Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Add Budget</Button>} /> :
       <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
         {budgets.map((b) => {
           const pct = b.limit_amount > 0 ? Math.min((Number(b.spent || 0) / Number(b.limit_amount)) * 100, 100) : 0;
           return (
             <Card key={b.id} className="card-hover">
               <CardContent className="p-5">
                 <div className="flex items-center justify-between mb-3">
                   <div>
                     <p className="font-medium">{b.name}</p>
                     <p className="text-xs text-muted-foreground">{b.category?.name || 'All categories'} · {b.period}</p>
                   </div>
                   <div className="flex gap-1">
                     <Button variant="ghost" size="icon" onClick={() => openEdit(b)}><Pencil className="h-4 w-4" /></Button>
                     <Button variant="ghost" size="icon" onClick={() => setDeleteId(b.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                   </div>
                 </div>
                 <div className="flex items-baseline justify-between mb-2">
                   <span className="text-2xl font-bold">{formatCurrency(Number(b.spent || 0), currency)}</span>
                   <span className="text-sm text-muted-foreground">of {formatCurrency(Number(b.limit_amount), currency)}</span>
                 </div>
                 <div className="h-2 rounded-full bg-muted overflow-hidden">
                   <div className={`h-full rounded-full transition-all ${pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : 'bg-gradient-to-r from-indigo-500 to-blue-500'}`} style={{ width: `${pct}%` }} />
                 </div>
                 <p className="text-xs text-muted-foreground mt-2">{pct.toFixed(0)}% used</p>
               </CardContent>
             </Card>
           );
         })}
       </div>}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Edit Budget' : 'New Budget'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label htmlFor="name">Name</Label><Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Monthly Groceries" /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="limit">Limit Amount</Label><Input id="limit" type="number" step="0.01" value={form.limit_amount} onChange={(e) => setForm({ ...form, limit_amount: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>Period</Label>
                <Select value={form.period} onValueChange={(v) => setForm({ ...form, period: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PERIOD_OPTIONS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                <SelectTrigger><SelectValue placeholder="All categories" /></SelectTrigger>
                <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label htmlFor="start">Start Date</Label><Input id="start" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={onSave}>{editId ? 'Update' : 'Create'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title="Delete budget?" confirmLabel="Delete" destructive onConfirm={handleDelete} />
    </div>
  );
}

export default function BudgetsPage() {
  return <ProtectedRoute><AppLayout><BudgetsContent /></AppLayout></ProtectedRoute>;
}

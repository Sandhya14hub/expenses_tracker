'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { categoryService, expenseService } from '@/lib/api';
import { ProtectedRoute } from '@/components/routes/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import type { Category } from '@/types';

export default function CreateExpensePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ amount: '', description: '', merchant: '', category_id: '', date: new Date().toISOString().split('T')[0], is_recurring: false });

  useEffect(() => {
    categoryService.list().then((data) => setCategories((data as Category[]) || []));
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) { toast.error('Enter a valid amount'); return; }
    setSubmitting(true);
    try {
      await expenseService.create({
        amount: Number(form.amount), description: form.description || null,
        merchant: form.merchant || null, category_id: form.category_id || null, date: form.date, is_recurring: form.is_recurring,
      });
    } catch (err) {
      setSubmitting(false);
      toast.error(err instanceof Error ? err.message : 'Failed to add expense');
      return;
    }
    setSubmitting(false);
    toast.success('Expense added');
    router.push('/expenses');
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="max-w-2xl">
          <Button variant="ghost" size="sm" asChild className="mb-4 gap-2"><Link href="/expenses"><ArrowLeft className="h-4 w-4" />Back</Link></Button>
          <PageHeader title="Add Expense" description="Record a new expense" />
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="amount">Amount</Label><Input id="amount" type="number" step="0.01" placeholder="0.00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></div>
              <div className="space-y-2"><Label htmlFor="date">Date</Label><Input id="date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="merchant">Merchant</Label><Input id="merchant" placeholder="e.g. Amazon, Starbucks" value={form.merchant} onChange={(e) => setForm({ ...form, merchant: e.target.value })} /></div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label htmlFor="description">Description</Label><Textarea id="description" placeholder="Optional notes" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="flex items-center gap-3"><Switch id="recurring" checked={form.is_recurring} onCheckedChange={(c) => setForm({ ...form, is_recurring: c })} /><Label htmlFor="recurring">Recurring expense</Label></div>
            <div className="flex gap-2"><Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save expense'}</Button><Button type="button" variant="outline" asChild><Link href="/expenses">Cancel</Link></Button></div>
          </form>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}

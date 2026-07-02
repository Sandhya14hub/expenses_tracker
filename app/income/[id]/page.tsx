'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { categoryService, incomeService } from '@/lib/api';
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
import type { Category, Income } from '@/types';

export default function EditIncomePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    amount: '', description: '', source: '', category_id: '', date: '', is_recurring: false,
  });

  useEffect(() => {
    Promise.all([
      categoryService.list(),
      incomeService.get(id),
    ]).then(([catData, incData]) => {
      setCategories((catData as Category[]) || []);
      if (incData) {
        const inc = incData as Income;
        setForm({
          amount: String(inc.amount), description: inc.description || '', source: inc.source || '',
          category_id: inc.category_id || '', date: inc.date, is_recurring: inc.is_recurring,
        });
      }
      setLoading(false);
    });
  }, [id]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await incomeService.update(id, {
        amount: Number(form.amount), description: form.description || null, source: form.source || null,
        category_id: form.category_id || null, date: form.date, is_recurring: form.is_recurring,
      });
    } catch (err) {
      setSubmitting(false);
      toast.error(err instanceof Error ? err.message : 'Failed to update income');
      return;
    }
    setSubmitting(false);
    toast.success('Income updated');
    router.push('/income');
  };

  if (loading) return <ProtectedRoute><AppLayout><div className="animate-pulse space-y-4"><div className="h-8 w-48 bg-muted rounded" /><div className="h-96 bg-muted rounded-lg" /></div></AppLayout></ProtectedRoute>;

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="max-w-2xl">
          <Button variant="ghost" size="sm" asChild className="mb-4 gap-2">
            <Link href="/income"><ArrowLeft className="h-4 w-4" />Back</Link>
          </Button>
          <PageHeader title="Edit Income" description="Update income details" />
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="amount">Amount</Label><Input id="amount" type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></div>
              <div className="space-y-2"><Label htmlFor="date">Date</Label><Input id="date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="source">Source</Label><Input id="source" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} /></div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label htmlFor="description">Description</Label><Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="flex items-center gap-3"><Switch id="recurring" checked={form.is_recurring} onCheckedChange={(c) => setForm({ ...form, is_recurring: c })} /><Label htmlFor="recurring">Recurring income</Label></div>
            <div className="flex gap-2"><Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Update income'}</Button><Button type="button" variant="outline" asChild><Link href="/income">Cancel</Link></Button></div>
          </form>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}

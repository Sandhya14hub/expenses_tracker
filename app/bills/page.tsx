'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Receipt, Check, Trash2, Calendar } from 'lucide-react';
import { billService, categoryService } from '@/lib/api';
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
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate, getDaysUntil } from '@/utils/formatDate';
import { toast } from 'sonner';
import type { Bill, Category } from '@/types';

function BillsContent() {
  const { profile } = useAuth();
  const [bills, setBills] = useState<Bill[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', amount: '', due_date: '', category_id: '', is_recurring: false, frequency: 'monthly' });
  const currency = profile?.currency || 'USD';

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const [billData, catData] = await Promise.all([
        billService.list(),
        categoryService.list(),
      ]);
      const expenseCats = ((catData as Category[]) || []).filter((c) => c.type === 'expense');
      setBills((billData as Bill[]) || []);
      setCategories(expenseCats);
    } catch {
      setError(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const onSave = async () => {
    if (!form.name.trim() || !form.amount || !form.due_date) { toast.error('Fill all required fields'); return; }
    try {
      await billService.create({ name: form.name, amount: Number(form.amount), due_date: form.due_date, category_id: form.category_id || null, is_recurring: form.is_recurring, frequency: form.frequency as 'weekly' | 'monthly' | 'yearly' });
      toast.success('Bill added');
      setDialogOpen(false); setForm({ name: '', amount: '', due_date: '', category_id: '', is_recurring: false, frequency: 'monthly' }); load();
    } catch (e: any) {
      toast.error(e?.message || 'Something went wrong');
    }
  };

  const togglePaid = async (bill: Bill) => {
    try {
      await billService.update(bill.id, { is_paid: !bill.is_paid });
      setBills((prev) => prev.map((b) => b.id === bill.id ? { ...b, is_paid: !b.is_paid } : b));
      toast.success(bill.is_paid ? 'Marked as unpaid' : 'Bill paid');
    } catch (e: any) {
      toast.error(e?.message || 'Something went wrong');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await billService.remove(deleteId);
      setBills((prev) => prev.filter((b) => b.id !== deleteId));
      toast.success('Bill deleted');
      setDeleteId(null);
    } catch (e: any) {
      toast.error(e?.message || 'Something went wrong');
    }
  };

  const upcoming = bills.filter((b) => !b.is_paid);
  const paid = bills.filter((b) => b.is_paid);

  const BillCard = ({ bill }: { bill: Bill }) => {
    const days = getDaysUntil(bill.due_date);
    return (
      <Card className="card-hover">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bill.is_paid ? 'bg-green-100 text-green-600 dark:bg-green-950/30' : days <= 3 ? 'bg-red-100 text-red-600 dark:bg-red-950/30' : 'bg-amber-100 text-amber-600 dark:bg-amber-950/30'}`}>
                <Receipt className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">{bill.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(bill.due_date)}</span>
                  {!bill.is_paid && days >= 0 && <Badge variant={days <= 3 ? 'destructive' : 'secondary'} className="text-xs">{days === 0 ? 'Due today' : `${days} days`}</Badge>}
                  {bill.is_recurring && <Badge variant="outline" className="text-xs">{bill.frequency}</Badge>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{formatCurrency(Number(bill.amount), currency)}</span>
              <Button variant="ghost" size="icon" onClick={() => togglePaid(bill)} title={bill.is_paid ? 'Mark unpaid' : 'Mark paid'}>
                <Check className={`h-4 w-4 ${bill.is_paid ? 'text-green-600' : 'text-muted-foreground'}`} />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setDeleteId(bill.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div>
      <PageHeader title="Bills" description="Track upcoming and recurring bills" action={<Button onClick={() => setDialogOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Add Bill</Button>} />
      {loading ? <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}</div> :
       error ? <ErrorState onRetry={load} /> :
       bills.length === 0 ? <EmptyState icon={Receipt} title="No bills yet" description="Add your bills to never miss a due date" action={<Button onClick={() => setDialogOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Add Bill</Button>} /> :
       <div className="space-y-6">
         {upcoming.length > 0 && <div><h3 className="text-sm font-semibold text-muted-foreground mb-3">Upcoming ({upcoming.length})</h3><div className="space-y-3">{upcoming.map((b) => <BillCard key={b.id} bill={b} />)}</div></div>}
         {paid.length > 0 && <div><h3 className="text-sm font-semibold text-muted-foreground mb-3">Paid ({paid.length})</h3><div className="space-y-3">{paid.map((b) => <BillCard key={b.id} bill={b} />)}</div></div>}
       </div>}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Bill</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label htmlFor="name">Bill Name</Label><Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Electric Bill" /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="amount">Amount</Label><Input id="amount" type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="due">Due Date</Label><Input id="due" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3"><Switch id="recurring" checked={form.is_recurring} onCheckedChange={(c) => setForm({ ...form, is_recurring: c })} /><Label htmlFor="recurring">Recurring bill</Label></div>
            {form.is_recurring && <div className="space-y-2"><Label>Frequency</Label><Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="yearly">Yearly</SelectItem></SelectContent></Select></div>}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={onSave}>Add Bill</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title="Delete bill?" confirmLabel="Delete" destructive onConfirm={handleDelete} />
    </div>
  );
}

export default function BillsPage() {
  return <ProtectedRoute><AppLayout><BillsContent /></AppLayout></ProtectedRoute>;
}

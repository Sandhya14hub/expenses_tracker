'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Target, Pencil, Trash2, Check } from 'lucide-react';
import { goalService } from '@/lib/api';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { toast } from 'sonner';
import type { Goal } from '@/types';

function GoalsContent() {
  const { profile } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [contributeId, setContributeId] = useState<string | null>(null);
  const [contributeAmount, setContributeAmount] = useState('');
  const [form, setForm] = useState({ name: '', target_amount: '', current_amount: '0', target_date: '', status: 'active' });
  const currency = profile?.currency || 'USD';

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const data = await goalService.list();
      setGoals((data as Goal[]) || []);
    } catch {
      setError(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditId(null); setForm({ name: '', target_amount: '', current_amount: '0', target_date: '', status: 'active' }); setDialogOpen(true); };
  const openEdit = (g: Goal) => { setEditId(g.id); setForm({ name: g.name, target_amount: String(g.target_amount), current_amount: String(g.current_amount), target_date: g.target_date || '', status: g.status }); setDialogOpen(true); };

  const onSave = async () => {
    if (!form.name.trim() || !form.target_amount) { toast.error('Fill all required fields'); return; }
    const payload = { name: form.name, target_amount: Number(form.target_amount), current_amount: Number(form.current_amount), target_date: form.target_date || null, status: form.status as Goal['status'] };
    try {
      if (editId) {
        await goalService.update(editId, payload);
        toast.success('Goal updated');
      } else {
        await goalService.create(payload);
        toast.success('Goal created');
      }
      setDialogOpen(false); load();
    } catch (e: any) {
      toast.error(e?.message || 'Something went wrong');
    }
  };

  const handleContribute = async () => {
    if (!contributeId || !contributeAmount) return;
    const goal = goals.find((g) => g.id === contributeId);
    if (!goal) return;
    const newAmount = Number(goal.current_amount) + Number(contributeAmount);
    try {
      await goalService.update(contributeId, { current_amount: newAmount, status: newAmount >= Number(goal.target_amount) ? 'completed' : 'active' });
      setGoals((prev) => prev.map((g) => g.id === contributeId ? { ...g, current_amount: newAmount, status: newAmount >= Number(g.target_amount) ? 'completed' : 'active' } : g));
      toast.success('Contribution added');
      setContributeId(null); setContributeAmount('');
    } catch (e: any) {
      toast.error(e?.message || 'Something went wrong');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await goalService.remove(deleteId);
      setGoals((prev) => prev.filter((g) => g.id !== deleteId));
      toast.success('Goal deleted');
      setDeleteId(null);
    } catch (e: any) {
      toast.error(e?.message || 'Something went wrong');
    }
  };

  return (
    <div>
      <PageHeader title="Savings Goals" description="Track progress towards your financial goals" action={<Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Add Goal</Button>} />
      {loading ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div> :
       error ? <ErrorState onRetry={load} /> :
       goals.length === 0 ? <EmptyState icon={Target} title="No goals yet" description="Set a savings goal to start working towards it" action={<Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Add Goal</Button>} /> :
       <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
         {goals.map((g) => {
           const pct = g.target_amount > 0 ? Math.min((Number(g.current_amount) / Number(g.target_amount)) * 100, 100) : 0;
           return (
             <Card key={g.id} className="card-hover">
               <CardContent className="p-5">
                 <div className="flex items-center justify-between mb-3">
                   <div className="flex items-center gap-2">
                     <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400"><Target className="h-5 w-5" /></div>
                     <div><p className="font-medium">{g.name}</p><Badge variant={g.status === 'completed' ? 'default' : g.status === 'paused' ? 'secondary' : 'outline'} className="mt-0.5">{g.status}</Badge></div>
                   </div>
                   <div className="flex gap-1">
                     <Button variant="ghost" size="icon" onClick={() => openEdit(g)}><Pencil className="h-4 w-4" /></Button>
                     <Button variant="ghost" size="icon" onClick={() => setDeleteId(g.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                   </div>
                 </div>
                 <div className="flex items-baseline justify-between mb-2">
                   <span className="text-2xl font-bold">{formatCurrency(Number(g.current_amount), currency)}</span>
                   <span className="text-sm text-muted-foreground">of {formatCurrency(Number(g.target_amount), currency)}</span>
                 </div>
                 <div className="h-2 rounded-full bg-muted overflow-hidden mb-2">
                   <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all" style={{ width: `${pct}%` }} />
                 </div>
                 <div className="flex items-center justify-between">
                   <span className="text-xs text-muted-foreground">{pct.toFixed(0)}% complete{g.target_date && ` · by ${formatDate(g.target_date)}`}</span>
                   {g.status !== 'completed' && <Button variant="outline" size="sm" onClick={() => setContributeId(g.id)} className="gap-1 h-7"><Plus className="h-3 w-3" />Add</Button>}
                 </div>
               </CardContent>
             </Card>
           );
         })}
       </div>}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Edit Goal' : 'New Goal'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label htmlFor="name">Goal Name</Label><Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Emergency Fund" /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="target">Target Amount</Label><Input id="target" type="number" step="0.01" value={form.target_amount} onChange={(e) => setForm({ ...form, target_amount: e.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="current">Current Amount</Label><Input id="current" type="number" step="0.01" value={form.current_amount} onChange={(e) => setForm({ ...form, current_amount: e.target.value })} /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="date">Target Date</Label><Input id="date" type="date" value={form.target_date} onChange={(e) => setForm({ ...form, target_date: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="paused">Paused</SelectItem><SelectItem value="completed">Completed</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={onSave}>{editId ? 'Update' : 'Create'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!contributeId} onOpenChange={(o) => !o && setContributeId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Contribution</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label htmlFor="contrib">Amount</Label><Input id="contrib" type="number" step="0.01" value={contributeAmount} onChange={(e) => setContributeAmount(e.target.value)} placeholder="0.00" autoFocus /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setContributeId(null)}>Cancel</Button><Button onClick={handleContribute} className="gap-2"><Check className="h-4 w-4" />Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title="Delete goal?" confirmLabel="Delete" destructive onConfirm={handleDelete} />
    </div>
  );
}

export default function GoalsPage() {
  return <ProtectedRoute><AppLayout><GoalsContent /></AppLayout></ProtectedRoute>;
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Banknote, Pencil, Trash2 } from 'lucide-react';
import { cardService } from '@/lib/api';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CARD_TYPES } from '@/utils/constants';
import { formatCurrency } from '@/utils/formatCurrency';
import { toast } from 'sonner';
import type { Card } from '@/types';

function CardsContent() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', card_type: 'visa', last_four: '', limit_amount: '', balance: '', expiry_date: '', color: '#6366f1' });

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const data = await cardService.list();
      setCards((data as Card[]) || []);
    } catch { setError(true); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditId(null); setForm({ name: '', card_type: 'visa', last_four: '', limit_amount: '', balance: '', expiry_date: '', color: '#6366f1' }); setDialogOpen(true); };
  const openEdit = (c: Card) => { setEditId(c.id); setForm({ name: c.name, card_type: c.card_type, last_four: c.last_four || '', limit_amount: String(c.limit_amount), balance: String(c.balance), expiry_date: c.expiry_date || '', color: c.color }); setDialogOpen(true); };

  const onSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    const payload = { name: form.name, card_type: form.card_type as 'visa' | 'mastercard' | 'amex' | 'discover', last_four: form.last_four || null, limit_amount: Number(form.limit_amount) || 0, balance: Number(form.balance) || 0, expiry_date: form.expiry_date || null, color: form.color };
    try {
      if (editId) {
        await cardService.update(editId, payload);
        toast.success('Card updated');
      } else {
        await cardService.create(payload);
        toast.success('Card added');
      }
    } catch (e) { toast.error((e as Error).message); return; }
    setDialogOpen(false); load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await cardService.remove(deleteId);
    } catch (e) { toast.error((e as Error).message); return; }
    setCards((prev) => prev.filter((c) => c.id !== deleteId));
    toast.success('Card deleted');
    setDeleteId(null);
  };

  return (
    <div>
      <PageHeader title="Credit Cards" description="Manage your credit and debit cards" action={<Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Add Card</Button>} />
      {loading ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div> :
       error ? <ErrorState onRetry={load} /> :
       cards.length === 0 ? <EmptyState icon={Banknote} title="No cards yet" description="Add a credit or debit card to track" action={<Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Add Card</Button>} /> :
       <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
         {cards.map((c) => {
           const utilization = c.limit_amount > 0 ? Math.min((Number(c.balance) / Number(c.limit_amount)) * 100, 100) : 0;
           return (
             <div key={c.id} className="group relative">
               <div className="rounded-2xl p-5 text-white shadow-lg card-hover aspect-[1.6/1] flex flex-col justify-between" style={{ background: `linear-gradient(135deg, ${c.color}, ${c.color}dd)` }}>
                 <div className="flex items-start justify-between">
                   <div>
                     <p className="text-sm text-white/80">{c.name}</p>
                     <p className="text-xs text-white/60 mt-1 uppercase">{c.card_type}</p>
                   </div>
                   <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                     <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20" onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                     <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20" onClick={() => setDeleteId(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                   </div>
                 </div>
                 <div>
                   <p className="text-lg font-mono tracking-wider">•••• {c.last_four || '••••'}</p>
                   <div className="flex items-end justify-between mt-2">
                     <div><p className="text-xs text-white/60">Balance</p><p className="text-lg font-bold">{formatCurrency(Number(c.balance))}</p></div>
                     <div className="text-right"><p className="text-xs text-white/60">Limit</p><p className="text-sm font-medium">{formatCurrency(Number(c.limit_amount))}</p></div>
                   </div>
                 </div>
               </div>
               {c.limit_amount > 0 && <div className="mt-2"><div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${utilization}%` }} /></div><p className="text-xs text-muted-foreground mt-1">{utilization.toFixed(0)}% utilized</p></div>}
             </div>
           );
         })}
       </div>}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Edit Card' : 'New Card'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label htmlFor="name">Card Name</Label><Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Chase Sapphire" /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Type</Label><Select value={form.card_type} onValueChange={(v) => setForm({ ...form, card_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CARD_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label htmlFor="last_four">Last 4 Digits</Label><Input id="last_four" maxLength={4} value={form.last_four} onChange={(e) => setForm({ ...form, last_four: e.target.value })} placeholder="1234" /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="limit">Credit Limit</Label><Input id="limit" type="number" step="0.01" value={form.limit_amount} onChange={(e) => setForm({ ...form, limit_amount: e.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="balance">Balance</Label><Input id="balance" type="number" step="0.01" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="expiry">Expiry Date</Label><Input id="expiry" type="month" value={form.expiry_date ? form.expiry_date.substring(0, 7) : ''} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} /></div>
            <div className="space-y-2"><Label>Card Color</Label><div className="flex gap-2">{['#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#22c55e', '#0ea5e9'].map((c) => <button key={c} onClick={() => setForm({ ...form, color: c })} className={`h-8 w-8 rounded-lg ${form.color === c ? 'ring-2 ring-offset-2 ring-primary' : ''}`} style={{ backgroundColor: c }} />)}</div></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={onSave}>{editId ? 'Update' : 'Add'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title="Delete card?" confirmLabel="Delete" destructive onConfirm={handleDelete} />
    </div>
  );
}

export default function CardsPage() {
  return <ProtectedRoute><AppLayout><CardsContent /></AppLayout></ProtectedRoute>;
}

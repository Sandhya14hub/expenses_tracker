'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Wallet as WalletIcon, Pencil, Trash2, Banknote, CreditCard } from 'lucide-react';
import { walletService } from '@/lib/api';
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
import { WALLET_TYPES, CURRENCIES } from '@/utils/constants';
import { formatCurrency } from '@/utils/formatCurrency';
import { toast } from 'sonner';
import type { Wallet } from '@/types';

const TYPE_ICONS: Record<string, React.ElementType> = { cash: WalletIcon, bank: Banknote, credit: CreditCard, debit: CreditCard, savings: WalletIcon };

function WalletsContent() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', type: 'bank', balance: '', currency: 'USD', institution: '' });

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const data = await walletService.list();
      setWallets((data as Wallet[]) || []);
    } catch { setError(true); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditId(null); setForm({ name: '', type: 'bank', balance: '', currency: 'USD', institution: '' }); setDialogOpen(true); };
  const openEdit = (w: Wallet) => { setEditId(w.id); setForm({ name: w.name, type: w.type, balance: String(w.balance), currency: w.currency, institution: w.institution || '' }); setDialogOpen(true); };

  const onSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    const payload = { name: form.name, type: form.type as 'cash' | 'bank' | 'credit' | 'debit' | 'savings', balance: Number(form.balance) || 0, currency: form.currency, institution: form.institution || null };
    try {
      if (editId) {
        await walletService.update(editId, payload);
        toast.success('Wallet updated');
      } else {
        await walletService.create(payload);
        toast.success('Wallet created');
      }
    } catch (e) { toast.error((e as Error).message); return; }
    setDialogOpen(false); load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await walletService.remove(deleteId);
    } catch (e) { toast.error((e as Error).message); return; }
    setWallets((prev) => prev.filter((w) => w.id !== deleteId));
    toast.success('Wallet deleted');
    setDeleteId(null);
  };

  const totalBalance = wallets.reduce((s, w) => s + Number(w.balance), 0);

  return (
    <div>
      <PageHeader title="Wallets" description="Manage your accounts and cash" action={<Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Add Wallet</Button>} />
      {loading ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div> :
       error ? <ErrorState onRetry={load} /> :
       wallets.length === 0 ? <EmptyState icon={WalletIcon} title="No wallets yet" description="Add a wallet to track your account balances" action={<Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Add Wallet</Button>} /> :
       <>
         <Card className="mb-6 bg-gradient-to-br from-indigo-500 to-blue-500 text-white border-0">
           <CardContent className="p-6"><p className="text-sm text-white/80">Total Balance</p><p className="text-3xl font-bold mt-1">{formatCurrency(totalBalance, 'USD')}</p></CardContent>
         </Card>
         <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
           {wallets.map((w) => {
             const Icon = TYPE_ICONS[w.type] || WalletIcon;
             return (
               <Card key={w.id} className="card-hover">
                 <CardContent className="p-5">
                   <div className="flex items-center justify-between mb-3">
                     <div className="flex items-center gap-3">
                       <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950/30"><Icon className="h-5 w-5" /></div>
                       <div><p className="font-medium">{w.name}</p><Badge variant="secondary" className="mt-0.5">{w.type}</Badge></div>
                     </div>
                     <div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => openEdit(w)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => setDeleteId(w.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button></div>
                   </div>
                   <p className="text-2xl font-bold">{formatCurrency(Number(w.balance), w.currency)}</p>
                   {w.institution && <p className="text-xs text-muted-foreground mt-1">{w.institution}</p>}
                 </CardContent>
               </Card>
             );
           })}
         </div>
       </>}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Edit Wallet' : 'New Wallet'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label htmlFor="name">Name</Label><Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Checking Account" /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Type</Label><Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{WALLET_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Currency</Label><Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CURRENCIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="space-y-2"><Label htmlFor="balance">Balance</Label><Input id="balance" type="number" step="0.01" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} placeholder="0.00" /></div>
            <div className="space-y-2"><Label htmlFor="institution">Institution</Label><Input id="institution" value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} placeholder="e.g. Chase Bank" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={onSave}>{editId ? 'Update' : 'Create'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title="Delete wallet?" confirmLabel="Delete" destructive onConfirm={handleDelete} />
    </div>
  );
}

export default function WalletsPage() {
  return <ProtectedRoute><AppLayout><WalletsContent /></AppLayout></ProtectedRoute>;
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Tags, Pencil, Trash2 } from 'lucide-react';
import { categoryService } from '@/lib/api';
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
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CATEGORY_COLORS } from '@/utils/constants';
import { toast } from 'sonner';
import type { Category } from '@/types';

function CategoriesContent() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', type: 'expense' as 'income' | 'expense', color: CATEGORY_COLORS[0] });

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const data = await categoryService.list();
      setCategories((data as Category[]) || []);
    } catch {
      setError(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditId(null); setForm({ name: '', type: 'expense', color: CATEGORY_COLORS[0] }); setDialogOpen(true); };
  const openEdit = (cat: Category) => { setEditId(cat.id); setForm({ name: cat.name, type: cat.type, color: cat.color }); setDialogOpen(true); };

  const onSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    try {
      if (editId) {
        await categoryService.update(editId, { name: form.name, type: form.type as 'income' | 'expense', color: form.color });
        toast.success('Category updated');
      } else {
        await categoryService.create({ name: form.name, type: form.type as 'income' | 'expense', color: form.color });
        toast.success('Category created');
      }
      setDialogOpen(false);
      load();
    } catch (e: any) {
      toast.error(e?.message || 'Something went wrong');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await categoryService.remove(deleteId);
      setCategories((prev) => prev.filter((c) => c.id !== deleteId));
      toast.success('Category deleted');
      setDeleteId(null);
    } catch {
      toast.error('Cannot delete category in use');
    }
  };

  return (
    <div>
      <PageHeader title="Categories" description="Organize your income and expenses" action={<Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Add Category</Button>} />
      {loading ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}</div> :
       error ? <ErrorState onRetry={load} /> :
       categories.length === 0 ? <EmptyState icon={Tags} title="No categories yet" description="Create categories to organize your transactions" action={<Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Add Category</Button>} /> :
       <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
         {categories.map((cat) => (
           <div key={cat.id} className="rounded-xl border p-4 card-hover">
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded-lg" style={{ backgroundColor: cat.color }} />
                 <div>
                   <p className="font-medium">{cat.name}</p>
                   <Badge variant={cat.type === 'income' ? 'default' : 'secondary'} className="mt-1">{cat.type}</Badge>
                 </div>
               </div>
               <div className="flex gap-1">
                 <Button variant="ghost" size="icon" onClick={() => openEdit(cat)}><Pencil className="h-4 w-4" /></Button>
                 <Button variant="ghost" size="icon" onClick={() => setDeleteId(cat.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
               </div>
             </div>
           </div>
         ))}
       </div>}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Edit Category' : 'New Category'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label htmlFor="name">Name</Label><Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Groceries" /></div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as 'income' | 'expense' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="income">Income</SelectItem><SelectItem value="expense">Expense</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_COLORS.map((c) => <button key={c} onClick={() => setForm({ ...form, color: c })} className={`h-8 w-8 rounded-lg transition-all ${form.color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''}`} style={{ backgroundColor: c }} />)}
              </div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={onSave}>{editId ? 'Update' : 'Create'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title="Delete category?" description="Transactions using this category will lose their reference." confirmLabel="Delete" destructive onConfirm={handleDelete} />
    </div>
  );
}

export default function CategoriesPage() {
  return <ProtectedRoute><AppLayout><CategoriesContent /></AppLayout></ProtectedRoute>;
}

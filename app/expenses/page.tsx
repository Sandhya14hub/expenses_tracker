'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, TrendingDown, Pencil, Trash2, Download } from 'lucide-react';
import { expenseService } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/routes/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchBar } from '@/components/common/SearchBar';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { SkeletonTable } from '@/components/common/SkeletonCard';
import { Pagination } from '@/components/common/Pagination';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDebounce } from '@/hooks/useDebounce';
import { usePagination } from '@/hooks/usePagination';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { exportToCSV } from '@/utils/export';
import { toast } from 'sonner';
import type { Expense } from '@/types';

function ExpenseListContent() {
  const { profile } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const currency = profile?.currency || 'USD';
  const { currentPage, goToPage, start, end, itemsPerPage } = usePagination(0, 8);

  const loadExpenses = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const data = await expenseService.list();
      setExpenses((data as Expense[]) || []);
    } catch {
      setError(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadExpenses(); }, [loadExpenses]);

  const filtered = expenses.filter((e) => {
    const q = debouncedSearch.toLowerCase();
    return !q || (e.description?.toLowerCase().includes(q) || e.merchant?.toLowerCase().includes(q) || e.category?.name?.toLowerCase().includes(q));
  });
  const paginated = filtered.slice(start, end);
  const pagination = usePagination(filtered.length, itemsPerPage);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await expenseService.remove(deleteId);
    } catch {
      toast.error('Failed to delete'); return;
    }
    setExpenses((prev) => prev.filter((e) => e.id !== deleteId));
    toast.success('Expense deleted');
    setDeleteId(null);
  };

  const handleExport = () => exportToCSV(filtered.map((e) => ({ date: e.date, description: e.description, merchant: e.merchant, category: e.category?.name, amount: e.amount, recurring: e.is_recurring })), 'expenses.csv');

  const columns = [
    { key: 'date', header: 'Date', render: (e: Expense) => <span className="text-sm">{formatDate(e.date)}</span> },
    { key: 'description', header: 'Description', render: (e: Expense) => <div><p className="text-sm font-medium">{e.description || e.merchant || 'Expense'}</p>{e.merchant && <p className="text-xs text-muted-foreground">{e.merchant}</p>}</div> },
    { key: 'category', header: 'Category', render: (e: Expense) => e.category ? <Badge variant="secondary">{e.category.name}</Badge> : <span className="text-muted-foreground text-sm">—</span> },
    { key: 'amount', header: 'Amount', render: (e: Expense) => <span className="text-sm font-semibold text-red-600">{formatCurrency(Number(e.amount), currency)}</span> },
    { key: 'recurring', header: 'Recurring', render: (e: Expense) => e.is_recurring ? <Badge>Yes</Badge> : <span className="text-muted-foreground text-sm">No</span> },
    { key: 'actions', header: '', className: 'text-right', render: (e: Expense) => <div className="flex items-center justify-end gap-1"><Button variant="ghost" size="icon" asChild><Link href={`/expenses/${e.id}`}><Pencil className="h-4 w-4" /></Link></Button><Button variant="ghost" size="icon" onClick={() => setDeleteId(e.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button></div> },
  ];

  return (
    <div>
      <PageHeader title="Expenses" description="Track all your expenses" action={<div className="flex gap-2"><Button variant="outline" onClick={handleExport} className="gap-2"><Download className="h-4 w-4" />Export</Button><Button asChild className="gap-2"><Link href="/expenses/new"><Plus className="h-4 w-4" />Add Expense</Link></Button></div>} />
      <div className="mb-4 max-w-sm"><SearchBar value={search} onChange={setSearch} placeholder="Search expenses..." /></div>
      {loading ? <SkeletonTable rows={5} /> : error ? <ErrorState onRetry={loadExpenses} /> : filtered.length === 0 ? <EmptyState icon={TrendingDown} title="No expenses found" description="Add your first expense to get started" action={<Button asChild className="gap-2"><Link href="/expenses/new"><Plus className="h-4 w-4" />Add Expense</Link></Button>} /> : <><DataTable columns={columns} data={paginated} /><Pagination currentPage={currentPage} totalPages={pagination.totalPages} onPageChange={goToPage} /></>}
      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title="Delete expense?" description="This action cannot be undone." confirmLabel="Delete" destructive onConfirm={handleDelete} />
    </div>
  );
}

export default function ExpenseListPage() {
  return <ProtectedRoute><AppLayout><ExpenseListContent /></AppLayout></ProtectedRoute>;
}

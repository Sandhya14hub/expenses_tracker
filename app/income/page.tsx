'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, TrendingUp, Pencil, Trash2, Download } from 'lucide-react';
import { incomeService } from '@/lib/api';
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
import type { Income } from '@/types';

function IncomeListContent() {
  const { profile } = useAuth();
  const [income, setIncome] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const currency = profile?.currency || 'USD';

  const { currentPage, goToPage, start, end, itemsPerPage } = usePagination(0, 8);

  const loadIncome = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await incomeService.list();
      setIncome((data as Income[]) || []);
    } catch {
      setError(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadIncome(); }, [loadIncome]);

  const filtered = income.filter((i) => {
    const q = debouncedSearch.toLowerCase();
    return !q || (i.description?.toLowerCase().includes(q) || i.source?.toLowerCase().includes(q) || i.category?.name?.toLowerCase().includes(q));
  });

  const paginated = filtered.slice(start, end);
  const pagination = usePagination(filtered.length, itemsPerPage);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await incomeService.remove(deleteId);
    } catch {
      toast.error('Failed to delete'); return;
    }
    setIncome((prev) => prev.filter((i) => i.id !== deleteId));
    toast.success('Income deleted');
    setDeleteId(null);
  };

  const handleExport = () => {
    exportToCSV(
      filtered.map((i) => ({
        date: i.date, description: i.description, source: i.source,
        category: i.category?.name, amount: i.amount, recurring: i.is_recurring,
      })),
      'income.csv'
    );
  };

  const columns = [
    { key: 'date', header: 'Date', render: (i: Income) => <span className="text-sm">{formatDate(i.date)}</span> },
    { key: 'description', header: 'Description', render: (i: Income) => (
      <div>
        <p className="text-sm font-medium">{i.description || i.source || 'Income'}</p>
        {i.source && <p className="text-xs text-muted-foreground">{i.source}</p>}
      </div>
    ) },
    { key: 'category', header: 'Category', render: (i: Income) => i.category ? <Badge variant="secondary">{i.category.name}</Badge> : <span className="text-muted-foreground text-sm">—</span> },
    { key: 'amount', header: 'Amount', render: (i: Income) => <span className="text-sm font-semibold text-green-600">{formatCurrency(Number(i.amount), currency)}</span> },
    { key: 'recurring', header: 'Recurring', render: (i: Income) => i.is_recurring ? <Badge>Yes</Badge> : <span className="text-muted-foreground text-sm">No</span> },
    { key: 'actions', header: '', className: 'text-right', render: (i: Income) => (
      <div className="flex items-center justify-end gap-1">
        <Button variant="ghost" size="icon" asChild><Link href={`/income/${i.id}`}><Pencil className="h-4 w-4" /></Link></Button>
        <Button variant="ghost" size="icon" onClick={() => setDeleteId(i.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader
        title="Income"
        description="Track all your income sources"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport} className="gap-2"><Download className="h-4 w-4" />Export</Button>
            <Button asChild className="gap-2"><Link href="/income/new"><Plus className="h-4 w-4" />Add Income</Link></Button>
          </div>
        }
      />

      <div className="mb-4 max-w-sm">
        <SearchBar value={search} onChange={setSearch} placeholder="Search income..." />
      </div>

      {loading ? <SkeletonTable rows={5} /> :
       error ? <ErrorState onRetry={loadIncome} /> :
       filtered.length === 0 ? <EmptyState icon={TrendingUp} title="No income found" description="Add your first income source to get started" action={<Button asChild className="gap-2"><Link href="/income/new"><Plus className="h-4 w-4" />Add Income</Link></Button>} /> :
       <>
         <DataTable columns={columns} data={paginated} />
         <Pagination currentPage={currentPage} totalPages={pagination.totalPages} onPageChange={goToPage} />
       </>
      }

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete income?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}

export default function IncomeListPage() {
  return <ProtectedRoute><AppLayout><IncomeListContent /></AppLayout></ProtectedRoute>;
}

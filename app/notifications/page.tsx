'use client';

import { useEffect } from 'react';
import { Bell, Check, Trash2, CheckCheck, Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import { ProtectedRoute } from '@/components/routes/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { SkeletonCard } from '@/components/common/SkeletonCard';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatTime, formatDate } from '@/utils/formatDate';
import { toast } from 'sonner';

const ICONS = { info: Info, success: CheckCircle, warning: AlertTriangle, error: XCircle };
const COLORS = {
  info: 'bg-blue-100 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400',
  success: 'bg-green-100 text-green-600 dark:bg-green-950/30 dark:text-green-400',
  warning: 'bg-amber-100 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400',
  error: 'bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400',
};

function NotificationsContent() {
  const { notifications, loading, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => { /* context handles loading */ }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteNotification(deleteId);
    toast.success('Notification deleted');
    setDeleteId(null);
  };

  return (
    <div>
      <PageHeader title="Notifications" description="Stay updated on your finances" action={notifications.length > 0 && <Button variant="outline" onClick={markAllAsRead} className="gap-2"><CheckCheck className="h-4 w-4" />Mark all read</Button>} />
      {loading ? <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}</div> :
       notifications.length === 0 ? <EmptyState icon={Bell} title="No notifications" description="You're all caught up!" /> :
       <div className="space-y-3">
         {notifications.map((n) => {
           const Icon = ICONS[n.type];
           return (
             <Card key={n.id} className={n.is_read ? 'opacity-60' : ''}>
               <CardContent className="p-4">
                 <div className="flex items-start gap-3">
                   <div className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${COLORS[n.type]}`}><Icon className="h-5 w-5" /></div>
                   <div className="flex-1 min-w-0">
                     <div className="flex items-center gap-2">
                       <p className="font-medium text-sm">{n.title}</p>
                       {!n.is_read && <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0" />}
                     </div>
                     {n.message && <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>}
                     <p className="text-xs text-muted-foreground mt-1">{formatDate(n.created_at)} · {formatTime(n.created_at)}</p>
                   </div>
                   <div className="flex gap-1 shrink-0">
                     {!n.is_read && <Button variant="ghost" size="icon" onClick={() => markAsRead(n.id)} title="Mark as read"><Check className="h-4 w-4" /></Button>}
                     <Button variant="ghost" size="icon" onClick={() => setDeleteId(n.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                   </div>
                 </div>
               </CardContent>
             </Card>
           );
         })}
       </div>}
      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title="Delete notification?" confirmLabel="Delete" destructive onConfirm={handleDelete} />
    </div>
  );
}

export default function NotificationsPage() {
  return <ProtectedRoute><AppLayout><NotificationsContent /></AppLayout></ProtectedRoute>;
}

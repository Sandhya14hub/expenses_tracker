'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/routes/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CURRENCIES } from '@/utils/constants';
import { profileService } from '@/lib/api';
import { toast } from 'sonner';

function SettingsContent() {
  const { user, profile, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    currency: profile?.currency || 'USD',
    monthly_budget: String(profile?.monthly_budget || '0'),
  });

  const onSave = async () => {
    setSaving(true);
    try {
      await profileService.update({
        full_name: form.full_name,
        currency: form.currency,
        monthly_budget: Number(form.monthly_budget) || 0,
      });
      await refreshProfile();
      toast.success('Settings saved');
    } catch (e) { toast.error((e as Error).message); }
    setSaving(false);
  };

  return (
    <div>
      <PageHeader title="Settings" description="Manage your account preferences" />
      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Profile Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label htmlFor="name">Full Name</Label><Input id="name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" value={user?.email || ''} disabled className="bg-muted" /></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Financial Preferences</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Default Currency</Label>
              <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.label} ({c.symbol})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label htmlFor="budget">Monthly Budget Target</Label><Input id="budget" type="number" step="0.01" value={form.monthly_budget} onChange={(e) => setForm({ ...form, monthly_budget: e.target.value })} /></div>
          </CardContent>
        </Card>
        <Button onClick={onSave} disabled={saving}>{saving ? 'Saving...' : 'Save settings'}</Button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return <ProtectedRoute><AppLayout><SettingsContent /></AppLayout></ProtectedRoute>;
}

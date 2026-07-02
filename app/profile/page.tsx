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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { profileService } from '@/lib/api';
import { getInitials } from '@/utils/helpers';
import { toast } from 'sonner';

function ProfileContent() {
  const { user, profile, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');

  const onSave = async () => {
    setSaving(true);
    try {
      await profileService.update({ full_name: fullName, avatar_url: avatarUrl || null });
      await refreshProfile();
      toast.success('Profile updated');
    } catch (e) { toast.error((e as Error).message); }
    setSaving(false);
  };

  return (
    <div>
      <PageHeader title="Profile" description="Your account information" />
      <div className="max-w-2xl space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarUrl || undefined} alt={fullName} />
                <AvatarFallback className="text-xl">{getInitials(fullName || user?.email || 'U')}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xl font-semibold">{fullName || 'User'}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <p className="text-xs text-muted-foreground mt-1">Member since {new Date(profile?.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Edit Profile</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label htmlFor="name">Full Name</Label><Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="avatar">Avatar URL</Label><Input id="avatar" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." /></div>
            <Button onClick={onSave} disabled={saving}>{saving ? 'Saving...' : 'Save profile'}</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return <ProtectedRoute><AppLayout><ProfileContent /></AppLayout></ProtectedRoute>;
}

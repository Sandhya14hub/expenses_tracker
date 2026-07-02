'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { mockAuth, profileService } from '@/lib/api';
import type { Profile } from '@/types';

type AuthContextValue = {
  user: { id: string; email: string } | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    const p = await profileService.get();
    setProfile(p);
  }, []);

  const refreshProfile = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    const session = mockAuth.getSession();
    if (session) {
      setUser({ id: 'demo-user', email: session.email });
      fetchProfile().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [fetchProfile]);

  const signIn = async (email: string, password: string) => {
    const { error } = await mockAuth.signIn(email, password);
    if (!error) {
      setUser({ id: 'demo-user', email });
      await fetchProfile();
    }
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await mockAuth.signUp(email, password, fullName);
    return { error };
  };

  const signOut = async () => {
    await mockAuth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

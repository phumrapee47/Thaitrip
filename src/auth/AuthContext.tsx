import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as authService from './authService';
import type { AppSession, LinkEmailResult } from './authService';
import { migrateLegacyEntries } from '../sync/migration';

interface AuthContextValue {
  session: AppSession | null;
  loading: boolean;
  /** T50: whether the one-time Data-Loss Warning Modal should currently be shown. */
  showAnonWarningModal: boolean;
  dismissAnonWarningModal: () => Promise<void>;
  linkEmail: (email: string, password: string) => Promise<LinkEmailResult>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AppSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAnonWarningModal, setShowAnonWarningModal] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { session: bootstrapped } = await authService.bootstrapSession();
      setSession(bootstrapped);

      // T42/T55/US-15: run on every app open, not just the very first one — migration
      // is idempotent (src/sync/migration.ts) so a no-op re-run is cheap, and this is
      // what lets a *partially*-failed migration resume on a later app open instead of
      // only ever getting one attempt tied to isNewSession. Fire-and-forget: must not
      // block first paint of Home.
      migrateLegacyEntries().catch(() => {
        // Sync engine will pick up any still-legacy rows on a later app open; never crash.
      });

      if (bootstrapped.isAnonymous) {
        const seen = await authService.hasSeenAnonWarning();
        if (!seen) setShowAnonWarningModal(true);
      }
      setLoading(false);
    })();
  }, []);

  const dismissAnonWarningModal = useCallback(async () => {
    await authService.markAnonWarningSeen();
    setShowAnonWarningModal(false);
  }, []);

  const linkEmail = useCallback(async (email: string, password: string) => {
    const result = await authService.linkEmail(email, password);
    if (result.ok) {
      setSession(await authService.getStoredSession());
    }
    return result;
  }, []);

  const refreshSession = useCallback(async () => {
    setSession(await authService.getStoredSession());
  }, []);

  return (
    <AuthContext.Provider
      value={{ session, loading, showAnonWarningModal, dismissAnonWarningModal, linkEmail, refreshSession }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

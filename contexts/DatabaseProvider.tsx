// ============================================================
// Kron — Database Provider
// Initializes DB + runs migrations + seeds dev data
// Wrap at the root of the app
// ============================================================

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getDatabase } from '@/db';
import { seedDevelopmentData } from '@/db/seed';

interface DatabaseState {
  isReady: boolean;
  error: string | null;
}

const DatabaseContext = createContext<DatabaseState>({
  isReady: false,
  error: null,
});

export function useDatabaseReady(): boolean {
  return useContext(DatabaseContext).isReady;
}

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DatabaseState>({
    isReady: false,
    error: null,
  });

  useEffect(() => {
    async function init() {
      try {
        // Opens DB, runs migrations
        await getDatabase();

        // Seed if empty (dev only — safe, checks for existing data)
        if (__DEV__) {
          await seedDevelopmentData();
        }

        setState({ isReady: true, error: null });
      } catch (err) {
        console.error('[Kron] Database init failed:', err);
        setState({
          isReady: false,
          error: err instanceof Error ? err.message : 'Unknown DB error',
        });
      }
    }

    init();
  }, []);

  // Block rendering until DB is ready
  if (!state.isReady) {
    return null; // Splash screen stays visible (handled by expo-splash-screen)
  }

  return (
    <DatabaseContext.Provider value={state}>
      {children}
    </DatabaseContext.Provider>
  );
}

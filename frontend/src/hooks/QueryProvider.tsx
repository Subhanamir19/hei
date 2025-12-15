import React from 'react';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 24 * 60 * 60 * 1000,
    },
  },
});

const persister = createAsyncStoragePersister({ storage: AsyncStorage });

interface Props {
  children: React.ReactNode;
}

export const QueryProvider: React.FC<Props> = ({ children }) => {
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
      {children}
    </PersistQueryClientProvider>
  );
};

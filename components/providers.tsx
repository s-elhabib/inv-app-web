"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "@/lib/queryClient";
import { useEffect } from "react";
import initSupabaseInterceptor from "@/lib/supabaseInterceptor";

export function Providers({ children }: { children: React.ReactNode }) {
  // Initialize the Supabase interceptor on component mount
  useEffect(() => {
    initSupabaseInterceptor();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

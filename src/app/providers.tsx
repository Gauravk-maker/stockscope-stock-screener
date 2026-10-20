
"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { makeQueryClient } from "../lib/query-client";
import StockWebSocketProvider from "../components/StockWebSocketProvider";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => makeQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <StockWebSocketProvider />
      {children}
    </QueryClientProvider>
  );
}

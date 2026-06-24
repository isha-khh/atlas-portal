import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider } from "react-oidc-context";
import { BrowserRouter } from "react-router";

import { ConfigProvider } from "@/contexts/config";
import { oidcConfig } from "@/lib/auth";
import { Router } from "@/router";

import "./i18n";
import "./styles/app.css";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: (failureCount, error) => {
                // Don't retry 4xx — they won't get better. Network errors retry up to 2x.
                const status = (error as { status?: number })?.status;
                if (status && status >= 400 && status < 500) return false;
                return failureCount < 2;
            },
            staleTime: 30_000,
            refetchOnWindowFocus: false,
        },
    },
});

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <AuthProvider {...oidcConfig}>
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    <ConfigProvider>
                        <Router />
                    </ConfigProvider>
                </BrowserRouter>
            </QueryClientProvider>
        </AuthProvider>
    </StrictMode>,
);

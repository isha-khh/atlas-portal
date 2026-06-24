import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import { useApiToken } from "@/lib/hooks/useApiToken";
import type { ReconcileReport } from "@/lib/types";

const reconcileKeys = {
    all: ["reconcile"] as const,
    dryRun: () => [...reconcileKeys.all, "dry-run"] as const,
};

/**
 * Dry-run reconcile — POST /api/reconcile/dry-run. Read-only on AD and PG;
 * just scans for auto-disable candidates. Treated as useQuery so React
 * StrictMode dedup works and the page can refresh by re-mounting.
 */
export const useReconcileDryRun = () => {
    const token = useApiToken();
    return useQuery({
        queryKey: reconcileKeys.dryRun(),
        queryFn: ({ signal }) =>
            apiFetch<ReconcileReport>("/api/reconcile/dry-run", {
                method: "POST",
                token,
                signal,
            }),
        enabled: Boolean(token),
        staleTime: 0,
        gcTime: 0,
        retry: false,
    });
};

/**
 * Real reconcile run — POST /api/reconcile/run. Disables AD accounts and
 * flips PG state for every auto-disable candidate. Invalidates staged-users
 * cache so the Staged Users list reflects the new state.
 */
export const useReconcileRun = () => {
    const token = useApiToken();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () =>
            apiFetch<ReconcileReport>("/api/reconcile/run", {
                method: "POST",
                token,
            }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: reconcileKeys.all });
            qc.invalidateQueries({ queryKey: ["staged-users"] });
        },
    });
};

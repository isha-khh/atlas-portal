import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import { useApiToken } from "@/lib/hooks/useApiToken";
import type {
    SyncHealthReport,
    SyncRun,
    SyncStatusResponse,
    SyncTriggerResponse,
} from "@/lib/types";

const syncKeys = {
    all: ["sync"] as const,
    runs: (limit: number) => [...syncKeys.all, "runs", limit] as const,
    status: () => [...syncKeys.all, "status"] as const,
    health: () => [...syncKeys.all, "health"] as const,
};

/**
 * GET /api/sync/status — light call, polled by the page to reflect "running"
 * state during a trigger. Cheap (single PG row read).
 */
export const useSyncStatus = (refetchIntervalMs?: number) => {
    const token = useApiToken();
    return useQuery({
        queryKey: syncKeys.status(),
        queryFn: ({ signal }) =>
            apiFetch<SyncStatusResponse>("/api/sync/status", { token, signal }),
        enabled: Boolean(token),
        refetchInterval: refetchIntervalMs ?? false,
        staleTime: 0,
    });
};

/**
 * GET /api/sync/runs?limit=N — recent atlas.sync_runs rows for the history
 * panel. Invalidated by useSyncTrigger on success.
 */
export const useSyncRuns = (limit = 20) => {
    const token = useApiToken();
    return useQuery({
        queryKey: syncKeys.runs(limit),
        queryFn: ({ signal }) =>
            apiFetch<SyncRun[]>("/api/sync/runs", {
                token,
                signal,
                query: { limit },
            }),
        enabled: Boolean(token),
        staleTime: 0,
    });
};

/**
 * GET /api/sync/health — the same verdict the daily monitor acts on (3
 * consecutive failures or staleness). Read-only, no mail. Surfaced on the page
 * so ops can see whether tonight's alert would fire without waiting for it.
 */
export const useSyncHealth = () => {
    const token = useApiToken();
    return useQuery({
        queryKey: syncKeys.health(),
        queryFn: ({ signal }) =>
            apiFetch<SyncHealthReport>("/api/sync/health", { token, signal }),
        enabled: Boolean(token),
        staleTime: 0,
    });
};

/**
 * POST /api/sync/trigger — fires a docker compose run --rm sync --upsert.
 * Sync wait; can take seconds. On success invalidates runs + status + the
 * staged-users cache (the upsert can flip is_present / add new rows).
 */
export const useSyncTrigger = () => {
    const token = useApiToken();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () =>
            apiFetch<SyncTriggerResponse>("/api/sync/trigger", {
                method: "POST",
                token,
            }),
        onSettled: () => {
            qc.invalidateQueries({ queryKey: syncKeys.all });
            qc.invalidateQueries({ queryKey: ["staged-users"] });
        },
    });
};

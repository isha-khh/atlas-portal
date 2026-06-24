import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import { useApiToken } from "@/lib/hooks/useApiToken";
import type {
    AdState,
    AnyProvisionResponse,
    ProvisionResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
    StagedUser,
} from "@/lib/types";

const stagedKeys = {
    all: ["staged-users"] as const,
    list: (adState?: AdState | null) => [...stagedKeys.all, "list", adState ?? "all"] as const,
    detail: (mail: string) => [...stagedKeys.all, "detail", mail] as const,
};

export const useStagedUsers = (adState?: AdState | null) => {
    const token = useApiToken();
    return useQuery({
        queryKey: stagedKeys.list(adState),
        queryFn: ({ signal }) =>
            apiFetch<StagedUser[]>("/api/staged-users", {
                token,
                query: { adState: adState ?? undefined },
                signal,
            }),
        enabled: Boolean(token),
    });
};

const encodeMail = (mail: string) => encodeURIComponent(mail);

export const useSelectStaged = () => {
    const token = useApiToken();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (mail: string) =>
            apiFetch<StagedUser>(`/api/staged-users/${encodeMail(mail)}/select`, {
                method: "POST",
                token,
            }),
        onSuccess: () => qc.invalidateQueries({ queryKey: stagedKeys.all }),
    });
};

export const useDeselectStaged = () => {
    const token = useApiToken();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (mail: string) =>
            apiFetch<StagedUser>(`/api/staged-users/${encodeMail(mail)}/deselect`, {
                method: "POST",
                token,
            }),
        onSuccess: () => qc.invalidateQueries({ queryKey: stagedKeys.all }),
    });
};

/**
 * Dry-run preview — fires automatically when `mail` is non-null.
 * Response shape differs based on staged_user.kind:
 *   - person → ProvisionResponse (user spec)
 *   - group  → GroupProvisionResponse (group spec + members[])
 * Caller narrows with `isGroupProvisionResponse`.
 *
 * Uses useQuery (not useMutation) so React StrictMode's double-mount dedups
 * and setState callbacks don't get attached to an unmounted component. The
 * endpoint is POST but dry-run is read-only, so treating it as a query is fine.
 */
export const useDryRunProvision = (mail: string | null) => {
    const token = useApiToken();
    return useQuery({
        queryKey: [...stagedKeys.all, "dry-run", mail],
        queryFn: ({ signal }) =>
            apiFetch<AnyProvisionResponse>(`/api/staged-users/${encodeMail(mail!)}/provision`, {
                method: "POST",
                token,
                query: { dryRun: "true" },
                signal,
            }),
        enabled: Boolean(token) && Boolean(mail),
        staleTime: 0,
        gcTime: 0,
        retry: false,
    });
};

/**
 * Real provision write. For a `person` row this creates one AD account and
 * returns a one-time password. For a `group` row this triggers the cascade:
 * AD group + all candidate members provisioned + emails sent — see the
 * GroupProvisionResponse `members` array for per-member outcomes.
 */
export const useProvisionStaged = () => {
    const token = useApiToken();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (mail: string) =>
            apiFetch<AnyProvisionResponse>(`/api/staged-users/${encodeMail(mail)}/provision`, {
                method: "POST",
                token,
            }),
        onSuccess: () => qc.invalidateQueries({ queryKey: stagedKeys.all }),
    });
};

/** Soft delete — AD account stays with ACCOUNTDISABLE, PG state → disabled. */
export const useDisableStaged = () => {
    const token = useApiToken();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (mail: string) =>
            apiFetch<StagedUser>(`/api/staged-users/${encodeMail(mail)}/disable`, {
                method: "POST",
                token,
            }),
        onSuccess: () => qc.invalidateQueries({ queryKey: stagedKeys.all }),
    });
};

/** Hard delete — AD entry removed, PG row reset to unselected. Destructive. */
export const useUnprovisionStaged = () => {
    const token = useApiToken();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (mail: string) =>
            apiFetch<StagedUser>(`/api/staged-users/${encodeMail(mail)}/unprovision`, {
                method: "POST",
                token,
            }),
        onSuccess: () => qc.invalidateQueries({ queryKey: stagedKeys.all }),
    });
};

/**
 * Reset a provisioned account's password (auto from policy, or manual).
 * Returns the new password once. Does not change ad_state, so no cache
 * invalidation needed.
 */
export const useResetPassword = () => {
    const token = useApiToken();
    return useMutation({
        mutationFn: ({ mail, request }: { mail: string; request: ResetPasswordRequest }) =>
            apiFetch<ResetPasswordResponse>(`/api/staged-users/${encodeMail(mail)}/reset-password`, {
                method: "POST",
                token,
                body: request,
            }),
    });
};

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import { useApiToken } from "@/lib/hooks/useApiToken";
import type {
    PasswordPolicyUpdate,
    PasswordPolicyView,
    ReconcileAdminsView,
    SmtpSettingsUpdate,
    SmtpSettingsView,
} from "@/lib/types";

const settingsKeys = {
    all: ["settings"] as const,
    smtp: () => [...settingsKeys.all, "smtp"] as const,
    reconcileAdmins: () => [...settingsKeys.all, "reconcile-admins"] as const,
    passwordPolicy: () => [...settingsKeys.all, "password-policy"] as const,
};

export const useSmtpSettings = () => {
    const token = useApiToken();
    return useQuery({
        queryKey: settingsKeys.smtp(),
        queryFn: ({ signal }) =>
            apiFetch<SmtpSettingsView>("/api/settings/smtp", { token, signal }),
        enabled: Boolean(token),
        staleTime: 30_000,
    });
};

export const useUpdateSmtpSettings = () => {
    const token = useApiToken();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (update: SmtpSettingsUpdate) =>
            apiFetch<SmtpSettingsView>("/api/settings/smtp", {
                method: "PUT",
                token,
                body: update,
            }),
        onSuccess: (data) => {
            qc.setQueryData(settingsKeys.smtp(), data);
        },
    });
};

export const useReconcileAdmins = () => {
    const token = useApiToken();
    return useQuery({
        queryKey: settingsKeys.reconcileAdmins(),
        queryFn: ({ signal }) =>
            apiFetch<ReconcileAdminsView>("/api/settings/reconcile-admins", { token, signal }),
        enabled: Boolean(token),
        staleTime: 30_000,
    });
};

export const useUpdateReconcileAdmins = () => {
    const token = useApiToken();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (update: ReconcileAdminsView) =>
            apiFetch<ReconcileAdminsView>("/api/settings/reconcile-admins", {
                method: "PUT",
                token,
                body: update,
            }),
        onSuccess: (data) => {
            qc.setQueryData(settingsKeys.reconcileAdmins(), data);
        },
    });
};

export const usePasswordPolicy = () => {
    const token = useApiToken();
    return useQuery({
        queryKey: settingsKeys.passwordPolicy(),
        queryFn: ({ signal }) =>
            apiFetch<PasswordPolicyView>("/api/settings/password-policy", { token, signal }),
        enabled: Boolean(token),
        staleTime: 30_000,
    });
};

export const useUpdatePasswordPolicy = () => {
    const token = useApiToken();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (update: PasswordPolicyUpdate) =>
            apiFetch<PasswordPolicyView>("/api/settings/password-policy", {
                method: "PUT",
                token,
                body: update,
            }),
        onSuccess: (data) => {
            qc.setQueryData(settingsKeys.passwordPolicy(), data);
        },
    });
};

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { apiFetch } from "@/lib/api";
import { useApiToken } from "@/lib/hooks/useApiToken";
import type { ReconcileReport, SyncHealthReport } from "@/lib/types";

type Severity = "error" | "warning" | "info";

type NotificationItem = {
    key: string;
    severity: Severity;
    text: string;
    url: string;
    icon: string;
};

const severityStyle: Record<Severity, { dot: string; text: string }> = {
    error: { dot: "status-error", text: "text-error" },
    warning: { dot: "status-warning", text: "text-warning" },
    info: { dot: "status-info", text: "text-info" },
};

/**
 * 鈴鐺的資料來源都是既有 API,沒有獨立的 notification 後端:
 * - GET /api/sync/health — 便宜(讀 sync_runs tail),常駐 + 5 分鐘輪詢,驅動紅點
 * - POST /api/reconcile/dry-run — 會掃 AD,**第一次展開 dropdown 才觸發**,
 *   staleTime 5 分鐘避免每次開關都重掃。queryKey 跟 reconcile 頁共用,
 *   到那頁重掃後鈴鐺也跟著新。
 */
export const TopbarNotificationButton = () => {
    const { t } = useTranslation();
    const token = useApiToken();
    // 展開過一次後保持 true — reconcile dry-run 查詢從此啟用
    const [armed, setArmed] = useState(false);

    const health = useQuery({
        queryKey: ["sync", "health"],
        queryFn: ({ signal }) => apiFetch<SyncHealthReport>("/api/sync/health", { token, signal }),
        enabled: Boolean(token),
        staleTime: 60_000,
        refetchInterval: 5 * 60_000,
        retry: false,
    });

    const reconcile = useQuery({
        queryKey: ["reconcile", "dry-run"],
        queryFn: ({ signal }) =>
            apiFetch<ReconcileReport>("/api/reconcile/dry-run", { method: "POST", token, signal }),
        enabled: Boolean(token) && armed,
        staleTime: 5 * 60_000,
        retry: false,
    });

    const items: NotificationItem[] = [];

    const h = health.data;
    if (h) {
        if (h.failureThresholdExceeded) {
            items.push({
                key: "sync-failures",
                severity: "error",
                text: t("notifications.syncAlert", {
                    count: h.consecutiveFailures,
                    threshold: h.failureThreshold,
                }),
                url: "/sync",
                icon: "lucide--cloud-off",
            });
        } else if (h.consecutiveFailures > 0) {
            items.push({
                key: "sync-failing",
                severity: "warning",
                text: t("notifications.syncFailing", { count: h.consecutiveFailures }),
                url: "/sync",
                icon: "lucide--cloud-alert",
            });
        }
        if (h.isStale) {
            items.push({
                key: "sync-stale",
                severity: "error",
                text: t("notifications.syncStale", {
                    hours: h.hoursSinceLastSuccess === null ? "?" : h.hoursSinceLastSuccess.toFixed(0),
                }),
                url: "/sync",
                icon: "lucide--clock-alert",
            });
        }
    }

    const r = reconcile.data;
    if (r) {
        if (r.toDisable.length > 0) {
            items.push({
                key: "reconcile-disable",
                severity: "warning",
                text: t("notifications.toDisable", { count: r.toDisable.length }),
                url: "/reconcile",
                icon: "lucide--user-x",
            });
        }
        if (r.drifts.length > 0) {
            items.push({
                key: "reconcile-drift",
                severity: "error",
                text: t("notifications.drift", { count: r.drifts.length }),
                url: "/reconcile",
                icon: "lucide--ghost",
            });
        }
        if (r.transfers.length > 0) {
            items.push({
                key: "reconcile-transfer",
                severity: "info",
                text: t("notifications.transfer", { count: r.transfers.length }),
                url: "/reconcile",
                icon: "lucide--arrow-right-left",
            });
        }
    }

    const attentionCount = items.filter((i) => i.severity !== "info").length;
    const isChecking = health.isLoading || (armed && reconcile.isLoading);
    const loadError = (health.error ?? (armed ? reconcile.error : null)) as Error | null;

    const closeMenu = () => {
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    };

    const onRefresh = () => {
        health.refetch();
        if (armed) reconcile.refetch();
    };

    return (
        <div className="dropdown dropdown-bottom dropdown-end">
            <div
                tabIndex={0}
                role="button"
                className="btn btn-circle btn-ghost btn-sm relative"
                aria-label={t("notifications.ariaLabel")}
                onClick={() => setArmed(true)}>
                <span className="iconify lucide--bell size-4.5" />
                {attentionCount > 0 && (
                    <div className="status status-error status-sm absolute end-1 top-1" />
                )}
            </div>
            <div tabIndex={0} className="dropdown-content bg-base-100 rounded-box mt-1 w-84 shadow-md">
                <div className="bg-base-200/30 rounded-t-box border-base-200 border-b px-4 py-3">
                    <div className="flex items-center justify-between">
                        <p className="font-medium">
                            {t("notifications.title")}
                            {attentionCount > 0 && (
                                <span className="badge badge-sm badge-error ms-2">{attentionCount}</span>
                            )}
                        </p>
                        <div className="flex items-center gap-1">
                            <button
                                className="btn btn-xs btn-circle btn-ghost"
                                aria-label={t("notifications.refresh")}
                                title={t("notifications.refresh")}
                                onClick={onRefresh}
                                disabled={isChecking}>
                                <span
                                    className={`iconify lucide--refresh-cw size-3.5 ${isChecking ? "animate-spin" : ""}`}
                                />
                            </button>
                            <button
                                className="btn btn-xs btn-circle btn-ghost"
                                aria-label={t("common.close")}
                                onClick={closeMenu}>
                                <span className="iconify lucide--x size-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {isChecking && (
                    <div className="text-base-content/60 flex items-center gap-2 px-4 py-4 text-sm">
                        <span className="loading loading-spinner loading-xs" />
                        {t("notifications.checking")}
                    </div>
                )}

                {loadError && !isChecking && (
                    <div className="text-error px-4 py-3 text-sm">
                        {t("notifications.loadFailed", { message: loadError.message })}
                    </div>
                )}

                {!isChecking && !loadError && items.length === 0 && (
                    <div className="text-base-content/60 flex items-center gap-2 px-4 py-5 text-sm">
                        <span className="iconify lucide--shield-check text-success size-4.5" />
                        {t("notifications.empty")}
                    </div>
                )}

                {items.length > 0 && (
                    <ul className="menu w-full p-1">
                        {items.map((item) => {
                            const s = severityStyle[item.severity];
                            return (
                                <li key={item.key}>
                                    <Link to={item.url} onClick={closeMenu} className="flex items-start gap-3 py-2.5">
                                        <span className={`iconify ${item.icon} ${s.text} mt-0.5 size-4.5 shrink-0`} />
                                        <span className="grow text-sm leading-snug">{item.text}</span>
                                        <span className={`status ${s.dot} mt-1 shrink-0`} />
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                )}

                <div className="border-base-200 text-base-content/50 border-t px-4 py-2 text-xs">
                    {t("notifications.reconcileHint")}
                </div>
            </div>
        </div>
    );
};

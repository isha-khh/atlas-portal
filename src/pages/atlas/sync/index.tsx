import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";

import { MetaData } from "@/components/MetaData";
import { PageTitle } from "@/components/PageTitle";
import { ApiError } from "@/lib/api";
import { useSyncHealth, useSyncRuns, useSyncStatus, useSyncTrigger } from "@/lib/hooks/useSync";
import type { SyncHealthReport, SyncRun, SyncRunStatus, SyncTriggerResponse } from "@/lib/types";

const formatTime = (iso: string | null) => {
    if (!iso) return "—";
    try {
        return new Date(iso).toLocaleString();
    } catch {
        return iso;
    }
};

const formatDuration = (ms: number | null) => {
    if (ms === null || ms === undefined) return "—";
    if (ms < 1000) return `${ms} ms`;
    return `${(ms / 1000).toFixed(2)} s`;
};

const HealthPanel = ({
    report,
    isLoading,
}: {
    report: SyncHealthReport | null;
    isLoading: boolean;
}) => {
    const { t } = useTranslation();

    const formatHours = (h: number | null) => {
        if (h === null || h === undefined) return "—";
        if (h < 1) return t("sync.minutes", { count: Math.round(h * 60) });
        return t("sync.hours", { count: Number(h.toFixed(1)) });
    };

    return (
        <div className="card bg-base-100 mt-5 p-4 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-semibold">{t("sync.health.heading")}</h3>
                {report &&
                    (report.shouldAlert ? (
                        <span className="badge badge-error gap-1">
                            <span className="iconify lucide--bell-ring size-3" />
                            {t("sync.health.alertBadge")}
                        </span>
                    ) : (
                        <span className="badge badge-success gap-1">
                            <span className="iconify lucide--shield-check size-3" />
                            {t("sync.health.healthyBadge")}
                        </span>
                    ))}
            </div>
            <p className="text-base-content/70 mt-1 text-xs">{t("sync.health.desc")}</p>

            {isLoading && (
                <div className="py-4 text-center">
                    <span className="loading loading-spinner loading-sm" />
                </div>
            )}

            {report && (
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                    <div className="bg-base-200 rounded-box px-3 py-2">
                        <p className="text-base-content/60 text-xs">{t("sync.health.consecutiveFailures")}</p>
                        <p
                            className={`mt-0.5 font-mono ${report.failureThresholdExceeded ? "text-error" : ""}`}>
                            {report.consecutiveFailures} / {report.failureThreshold}
                        </p>
                    </div>
                    <div className="bg-base-200 rounded-box px-3 py-2">
                        <p className="text-base-content/60 text-xs">{t("sync.health.lastSuccess")}</p>
                        <p className="mt-0.5 font-mono text-xs">
                            {formatTime(report.lastSuccessAt)}
                        </p>
                        <p className="text-base-content/50 text-xs">
                            {report.hoursSinceLastSuccess === null
                                ? t("sync.health.noRecord")
                                : t("sync.health.ago", {
                                      duration: formatHours(report.hoursSinceLastSuccess),
                                  })}
                        </p>
                    </div>
                    <div className="bg-base-200 rounded-box px-3 py-2">
                        <p className="text-base-content/60 text-xs">{t("sync.health.staleness")}</p>
                        <p className={`mt-0.5 font-mono ${report.isStale ? "text-error" : ""}`}>
                            {report.isStale ? t("sync.health.stale") : t("sync.health.fresh")}
                        </p>
                        <p className="text-base-content/50 text-xs">
                            {t("sync.health.threshold", { hours: report.stalenessHours })}
                        </p>
                    </div>
                    <div className="bg-base-200 rounded-box px-3 py-2">
                        <p className="text-base-content/60 text-xs">{t("sync.health.evaluatedAt")}</p>
                        <p className="mt-0.5 font-mono text-xs">{formatTime(report.evaluatedAt)}</p>
                        <p className="text-base-content/50 text-xs">
                            {t("sync.health.inspected", { count: report.inspectedRunCount })}
                        </p>
                    </div>
                </div>
            )}

            {report?.shouldAlert && report.latestFailedRun?.error && (
                <div className="alert alert-warning mt-4">
                    <span className="iconify lucide--alert-triangle size-5" />
                    <div className="text-sm">
                        <p className="font-medium">
                            {t("sync.health.latestFailed", { runId: report.latestFailedRun.runId })}
                        </p>
                        <p className="mt-1 font-mono text-xs">{report.latestFailedRun.error}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

// 狀態值對應 sync_runs.status;labelKey 不認得的值原樣顯示
const statusBadge = (status: SyncRunStatus) => {
    switch (status) {
        case "running":
            return { cls: "badge-info", icon: "lucide--loader-2", labelKey: "sync.status.running" };
        case "success":
            return { cls: "badge-success", icon: "lucide--check-circle-2", labelKey: "sync.status.success" };
        case "failed":
            return { cls: "badge-error", icon: "lucide--x-circle", labelKey: "sync.status.failed" };
        default:
            return { cls: "badge-ghost", icon: "lucide--circle", labelKey: status };
    }
};

const SyncPage = () => {
    const { t } = useTranslation();
    // Poll status every 2s while a trigger is in flight so the badge reflects
    // the container's running state. Outside of a trigger, refetch on focus only.
    const trigger = useSyncTrigger();
    const status = useSyncStatus(trigger.isPending ? 2_000 : undefined);
    const runs = useSyncRuns(20);
    const health = useSyncHealth();
    const [lastResult, setLastResult] = useState<SyncTriggerResponse | null>(null);

    const isBusy = trigger.isPending || (status.data?.isRunning ?? false);
    const isDisabled = status.data ? !status.data.enabled : false;
    const error = trigger.error as ApiError | Error | null;

    const onTrigger = () => {
        trigger.mutate(undefined, {
            onSuccess: (data) => setLastResult(data),
        });
    };

    return (
        <>
            <MetaData title={t("sync.title")} />
            <div className="p-5 md:p-6">
                <PageTitle
                    title={t("sync.title")}
                    items={[{ label: t("nav.atlas") }, { label: t("sync.title"), active: true }]}
                />

                <div className="card bg-base-100 mt-5 p-4 md:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-semibold">{t("sync.heading")}</h2>
                            <p className="text-base-content/70 mt-1 text-sm">
                                {t("sync.descLine1")}
                                <br />
                                {t("sync.descLine2")}
                                <br />
                                {t("sync.descLine3")}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                className="btn btn-sm btn-primary"
                                onClick={onTrigger}
                                disabled={isBusy || isDisabled}>
                                {isBusy ? (
                                    <>
                                        <span className="loading loading-spinner loading-xs" />
                                        {t("sync.triggering")}
                                    </>
                                ) : (
                                    <>
                                        <span className="iconify lucide--play size-3.5" />
                                        {t("sync.triggerNow")}
                                    </>
                                )}
                            </button>
                            <button
                                className="btn btn-sm btn-ghost"
                                onClick={() => {
                                    status.refetch();
                                    runs.refetch();
                                    health.refetch();
                                }}
                                disabled={status.isFetching || runs.isFetching || health.isFetching}>
                                <span className="iconify lucide--refresh-cw size-3.5" />
                                {t("sync.refresh")}
                            </button>
                        </div>
                    </div>

                    {isDisabled && (
                        <div className="alert alert-warning mt-4">
                            <span className="iconify lucide--shield-alert size-5" />
                            <div className="text-sm">
                                <p className="font-medium">{t("sync.disabledTitle")}</p>
                                <p className="mt-1 text-xs">
                                    <Trans
                                        i18nKey="sync.disabledBody"
                                        components={{ code: <code className="font-mono" /> }}
                                    />
                                </p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="alert alert-error mt-4">
                            <span className="iconify lucide--alert-triangle size-5" />
                            <div>
                                <p className="font-medium">
                                    {error instanceof ApiError
                                        ? `${error.status} ${error.title}`
                                        : t("common.error")}
                                </p>
                                {error instanceof ApiError && error.detail && (
                                    <p className="mt-1 text-sm">{error.detail}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Status bar */}
                    <div className="bg-base-200 rounded-box mt-4 px-4 py-3 text-sm">
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                            <span>
                                {t("sync.statusLabel")}
                                {isBusy ? (
                                    <span className="badge badge-info ms-2 gap-1">
                                        <span className="iconify lucide--loader-2 size-3 animate-spin" />
                                        {t("sync.status.running")}
                                    </span>
                                ) : (
                                    <span className="badge badge-ghost ms-2">{t("sync.status.idle")}</span>
                                )}
                            </span>
                            {status.data?.latest && (
                                <>
                                    <span>
                                        {t("sync.lastFinished")}
                                        <span className="font-mono text-xs ms-1">
                                            {formatTime(status.data.latest.finishedAt)}
                                        </span>
                                    </span>
                                    <span>
                                        {t("sync.lastStatus")}
                                        {(() => {
                                            const b = statusBadge(status.data.latest.status);
                                            return (
                                                <span className={`badge ${b.cls} ms-2 gap-1`}>
                                                    <span className={`iconify ${b.icon} size-3`} />
                                                    {t(b.labelKey)}
                                                </span>
                                            );
                                        })()}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Last trigger result */}
                    {lastResult && (
                        <div
                            className={`alert mt-4 ${lastResult.success ? "alert-success" : "alert-error"}`}>
                            <span
                                className={`iconify ${lastResult.success ? "lucide--check-circle-2" : "lucide--x-circle"} size-5`}
                            />
                            <div className="text-sm w-full">
                                <p className="font-medium">
                                    {lastResult.success ? t("sync.resultSuccess") : t("sync.resultFailed")}{" "}
                                    {t("sync.resultMeta", {
                                        exitCode: lastResult.exitCode,
                                        duration: formatDuration(lastResult.durationMs),
                                    })}
                                </p>
                                {lastResult.error && (
                                    <p className="mt-1 font-mono text-xs">{lastResult.error}</p>
                                )}
                                {(lastResult.stdoutTail || lastResult.stderrTail) && (
                                    <details className="mt-2">
                                        <summary className="cursor-pointer text-xs">{t("sync.outputTail")}</summary>
                                        {lastResult.stdoutTail && (
                                            <div className="mt-2">
                                                <p className="text-xs font-semibold">stdout</p>
                                                <pre className="bg-base-300 rounded mt-1 max-h-48 overflow-auto p-2 text-xs">
                                                    {lastResult.stdoutTail}
                                                </pre>
                                            </div>
                                        )}
                                        {lastResult.stderrTail && (
                                            <div className="mt-2">
                                                <p className="text-xs font-semibold">stderr</p>
                                                <pre className="bg-base-300 rounded mt-1 max-h-48 overflow-auto p-2 text-xs">
                                                    {lastResult.stderrTail}
                                                </pre>
                                            </div>
                                        )}
                                    </details>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Monitor health — same verdict the daily alert mail acts on */}
                <HealthPanel report={health.data ?? null} isLoading={health.isLoading} />

                {/* History */}
                <div className="card bg-base-100 mt-5 p-4 md:p-6">
                    <h3 className="text-base font-semibold">{t("sync.history.heading")}</h3>
                    <div className="mt-3 max-h-[60vh] overflow-y-auto">
                        <table className="table table-sm">
                            <thead className="bg-base-200 sticky top-0">
                                <tr>
                                    <th>{t("sync.history.runId")}</th>
                                    <th>{t("sync.history.source")}</th>
                                    <th>{t("sync.history.started")}</th>
                                    <th>{t("sync.history.finished")}</th>
                                    <th className="text-right">{t("sync.history.seen")}</th>
                                    <th className="text-right">{t("sync.history.upserted")}</th>
                                    <th className="text-right">{t("sync.history.disappeared")}</th>
                                    <th>{t("sync.history.status")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(runs.data ?? []).map((row: SyncRun) => {
                                    const b = statusBadge(row.status);
                                    return (
                                        <tr key={row.runId}>
                                            <td className="font-mono text-xs">{row.runId}</td>
                                            <td className="text-xs">{row.source}</td>
                                            <td className="font-mono text-xs">{formatTime(row.startedAt)}</td>
                                            <td className="font-mono text-xs">{formatTime(row.finishedAt)}</td>
                                            <td className="text-right text-xs">{row.entriesSeen ?? "—"}</td>
                                            <td className="text-right text-xs">{row.entriesUpserted ?? "—"}</td>
                                            <td className="text-right text-xs">{row.entriesDisappeared ?? "—"}</td>
                                            <td>
                                                <span className={`badge ${b.cls} gap-1`}>
                                                    <span className={`iconify ${b.icon} size-3`} />
                                                    {t(b.labelKey)}
                                                </span>
                                                {row.error && (
                                                    <div className="mt-1 max-w-md truncate font-mono text-[10px] text-error">
                                                        {row.error}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {(runs.data?.length ?? 0) === 0 && !runs.isLoading && (
                                    <tr>
                                        <td colSpan={8} className="text-base-content/50 py-4 text-center text-xs">
                                            {t("common.noRecords")}
                                        </td>
                                    </tr>
                                )}
                                {runs.isLoading && (
                                    <tr>
                                        <td colSpan={8} className="py-4 text-center">
                                            <span className="loading loading-spinner loading-sm" />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SyncPage;

import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";

import { MetaData } from "@/components/MetaData";
import { PageTitle } from "@/components/PageTitle";
import { ApiError } from "@/lib/api";
import { useReconcileDryRun, useReconcileRun } from "@/lib/hooks/useReconcile";
import type {
    DisableCandidate,
    DisableOutcome,
    DriftAlert,
    ReconcileReport,
    TransferAlert,
} from "@/lib/types";

const formatTime = (iso: string) => {
    try {
        return new Date(iso).toLocaleString();
    } catch {
        return iso;
    }
};

const reasonBadge = (reason: string) => {
    switch (reason) {
        case "lifecycle:left":
            return { cls: "badge-warning", icon: "lucide--user-x" };
        case "lifecycle:drift-ad-gone":
            return { cls: "badge-error", icon: "lucide--ghost" };
        case "lifecycle:drift-ad-disabled":
            return { cls: "badge-error", icon: "lucide--shield-x" };
        default:
            return { cls: "badge-ghost", icon: "lucide--circle" };
    }
};

const driftBadge = (kind: string) => {
    switch (kind) {
        case "AdGone":
            return { cls: "badge-error", icon: "lucide--ghost", labelKey: "reconcile.driftKind.adGone" };
        case "AdDisabled":
            return { cls: "badge-error", icon: "lucide--shield-x", labelKey: "reconcile.driftKind.adDisabled" };
        case "AdMoved":
            return { cls: "badge-info", icon: "lucide--move", labelKey: "reconcile.driftKind.adMoved" };
        default:
            return { cls: "badge-ghost", icon: "lucide--circle", labelKey: kind };
    }
};

const CandidateTable = ({ rows }: { rows: DisableCandidate[] }) => {
    const { t } = useTranslation();
    return (
        <div className="mt-3 max-h-[40vh] overflow-y-auto">
            <table className="table table-sm">
                <thead className="bg-base-200 sticky top-0">
                    <tr>
                        <th>{t("reconcile.candidateTable.mail")}</th>
                        <th>{t("reconcile.candidateTable.sam")}</th>
                        <th>{t("reconcile.candidateTable.parentOu")}</th>
                        <th>{t("reconcile.candidateTable.reason")}</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((c) => {
                        const b = reasonBadge(c.reason);
                        return (
                            <tr key={c.mail}>
                                <td className="font-mono text-xs">{c.mail}</td>
                                <td className="font-mono text-xs">{c.adSam}</td>
                                <td className="text-xs">{c.parentOu}</td>
                                <td>
                                    <span className={`badge ${b.cls} gap-1`}>
                                        <span className={`iconify ${b.icon} size-3`} />
                                        {c.reason}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                    {rows.length === 0 && (
                        <tr>
                            <td colSpan={4} className="text-base-content/50 py-4 text-center text-xs">
                                {t("common.none")}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

const DriftTable = ({ rows }: { rows: DriftAlert[] }) => {
    const { t } = useTranslation();
    return (
        <div className="mt-3 max-h-[40vh] overflow-y-auto">
            <table className="table table-sm">
                <thead className="bg-base-200 sticky top-0">
                    <tr>
                        <th>{t("reconcile.driftTable.kind")}</th>
                        <th>{t("reconcile.driftTable.mail")}</th>
                        <th>{t("reconcile.driftTable.sam")}</th>
                        <th>{t("reconcile.driftTable.expectedDn")}</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((d) => {
                        const b = driftBadge(d.driftKind);
                        return (
                            <tr key={`${d.mail}-${d.driftKind}`}>
                                <td>
                                    <span className={`badge ${b.cls} gap-1`}>
                                        <span className={`iconify ${b.icon} size-3`} />
                                        {t(b.labelKey)}
                                    </span>
                                </td>
                                <td className="font-mono text-xs">{d.mail}</td>
                                <td className="font-mono text-xs">{d.adSam}</td>
                                <td className="text-base-content/60 font-mono text-xs">{d.expectedDn}</td>
                            </tr>
                        );
                    })}
                    {rows.length === 0 && (
                        <tr>
                            <td colSpan={4} className="text-base-content/50 py-4 text-center text-xs">
                                {t("common.none")}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

const TransferTable = ({ rows }: { rows: TransferAlert[] }) => {
    const { t } = useTranslation();
    return (
        <div className="mt-3 max-h-[40vh] overflow-y-auto">
            <table className="table table-sm">
                <thead className="bg-base-200 sticky top-0">
                    <tr>
                        <th>{t("reconcile.transferTable.mail")}</th>
                        <th>{t("reconcile.transferTable.sam")}</th>
                        <th>{t("reconcile.transferTable.from")}</th>
                        <th>{t("reconcile.transferTable.to")}</th>
                        <th>{t("reconcile.transferTable.currentGroup")}</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.mail}>
                            <td className="font-mono text-xs">{row.mail}</td>
                            <td className="font-mono text-xs">{row.adSam}</td>
                            <td className="text-base-content/70 text-xs">{row.fromParentOu}</td>
                            <td className="text-xs">{row.toParentOu}</td>
                            <td className="text-base-content/60 font-mono text-xs">{row.currentGroup}</td>
                        </tr>
                    ))}
                    {rows.length === 0 && (
                        <tr>
                            <td colSpan={5} className="text-base-content/50 py-4 text-center text-xs">
                                {t("common.none")}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

const OutcomeTable = ({ rows }: { rows: DisableOutcome[] }) => {
    const { t } = useTranslation();
    return (
        <div className="mt-3 max-h-[40vh] overflow-y-auto">
            <table className="table table-sm">
                <thead className="bg-base-200 sticky top-0">
                    <tr>
                        <th>{t("reconcile.outcomeTable.result")}</th>
                        <th>{t("reconcile.outcomeTable.mail")}</th>
                        <th>{t("reconcile.outcomeTable.sam")}</th>
                        <th>{t("reconcile.outcomeTable.reasonError")}</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((o) => (
                        <tr key={o.mail}>
                            <td>
                                {o.succeeded ? (
                                    <span className="badge badge-success gap-1">
                                        <span className="iconify lucide--check size-3" />
                                        {t("reconcile.outcomeDisabled")}
                                    </span>
                                ) : (
                                    <span className="badge badge-error gap-1">
                                        <span className="iconify lucide--alert-triangle size-3" />
                                        {t("reconcile.outcomeFailed")}
                                    </span>
                                )}
                            </td>
                            <td className="font-mono text-xs">{o.mail}</td>
                            <td className="font-mono text-xs">{o.adSam}</td>
                            <td className="text-xs">
                                {o.succeeded ? (
                                    <span className="text-base-content/70">{o.reason}</span>
                                ) : (
                                    <span className="text-error">{o.error ?? t("reconcile.unknownError")}</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const ReconcilePage = () => {
    const { t } = useTranslation();
    const dryRun = useReconcileDryRun();
    const run = useReconcileRun();
    const [result, setResult] = useState<ReconcileReport | null>(null);
    const [confirming, setConfirming] = useState(false);

    const view = result ?? dryRun.data ?? null;
    const candidates = view?.toDisable ?? [];
    const drifts = view?.drifts ?? [];
    const transfers = view?.transfers ?? [];
    const error = (dryRun.error ?? run.error) as ApiError | Error | null;

    // Run does work when there's something to disable OR drift to stamp.
    // Transfers are alert-only — no PG/AD writes — so they don't unlock the button.
    const hasActions = candidates.length > 0 || drifts.length > 0;

    const onConfirm = () => {
        setConfirming(false);
        run.mutate(undefined, {
            onSuccess: (data) => setResult(data),
        });
    };

    const onReset = () => {
        setResult(null);
        dryRun.refetch();
    };

    return (
        <>
            <MetaData title={t("reconcile.title")} />
            <div className="p-5 md:p-6">
                <PageTitle
                    title={t("reconcile.title")}
                    items={[{ label: t("nav.atlas") }, { label: t("reconcile.title"), active: true }]}
                />

                <div className="card bg-base-100 mt-5 p-4 md:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-semibold">{t("reconcile.heading")}</h2>
                            <p className="text-base-content/70 mt-1 text-sm">
                                {t("reconcile.descIntro")}
                                <br />
                                <span className="text-warning">{t("reconcile.descA")}</span>{" "}
                                {t("reconcile.descAText")}
                                <span className="text-error ms-3">{t("reconcile.descG")}</span>{" "}
                                {t("reconcile.descGText")}
                                <span className="text-info ms-3">{t("reconcile.descB")}</span>{" "}
                                {t("reconcile.descBText")}
                                <br />
                                <Trans
                                    i18nKey="reconcile.descFooter"
                                    components={{ code: <code className="font-mono" /> }}
                                />
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                className="btn btn-sm btn-ghost"
                                onClick={() => dryRun.refetch()}
                                disabled={dryRun.isFetching || run.isPending}>
                                <span className="iconify lucide--refresh-cw size-3.5" />
                                {t("reconcile.rescan")}
                            </button>
                        </div>
                    </div>

                    {dryRun.isLoading && (
                        <div className="flex flex-col items-center gap-3 py-10">
                            <span className="loading loading-spinner loading-lg text-primary" />
                            <p className="text-base-content/70 text-sm">{t("reconcile.scanning")}</p>
                        </div>
                    )}

                    {error && !result && (
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

                    {view && (
                        <>
                            {/* Summary bar */}
                            <div className="bg-base-200 rounded-box mt-4 px-4 py-3 text-sm">
                                <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                                    <span>
                                        {result ? t("reconcile.summaryRun") : t("reconcile.summaryDryRun")} @{" "}
                                        <span className="font-mono text-xs">{formatTime(view.completedAt)}</span>
                                    </span>
                                    <span className="font-medium">
                                        {t("reconcile.summaryToDisable")}{" "}
                                        <span className="text-warning ms-1">{candidates.length}</span>
                                    </span>
                                    <span className="font-medium">
                                        {t("reconcile.summaryDrift")}{" "}
                                        <span className="text-error ms-1">{drifts.length}</span>
                                    </span>
                                    <span className="font-medium">
                                        {t("reconcile.summaryTransfer")}{" "}
                                        <span className="text-info ms-1">{transfers.length}</span>
                                    </span>
                                </div>
                            </div>

                            {result && (
                                <>
                                    <div className="alert alert-success mt-4">
                                        <span className="iconify lucide--check-circle-2 size-5" />
                                        <div className="text-sm">
                                            <p className="font-medium">{t("reconcile.runCompleted")}</p>
                                            <p className="text-xs">
                                                {t("reconcile.runTimes", {
                                                    started: formatTime(result.startedAt),
                                                    completed: formatTime(result.completedAt),
                                                })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="stats stats-vertical lg:stats-horizontal bg-base-200 mt-4 w-full shadow-none">
                                        <div className="stat py-3">
                                            <div className="stat-title text-xs">{t("reconcile.statCandidates")}</div>
                                            <div className="stat-value text-2xl">{result.toDisable.length}</div>
                                        </div>
                                        <div className="stat py-3">
                                            <div className="stat-title text-xs">{t("reconcile.statDisabled")}</div>
                                            <div className="stat-value text-success text-2xl">
                                                {result.disableOutcomes.filter((o) => o.succeeded).length}
                                            </div>
                                        </div>
                                        {result.disableOutcomes.some((o) => !o.succeeded) && (
                                            <div className="stat py-3">
                                                <div className="stat-title text-xs">{t("reconcile.statFailed")}</div>
                                                <div className="stat-value text-error text-2xl">
                                                    {result.disableOutcomes.filter((o) => !o.succeeded).length}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* Always-shown sections (dry-run + run) */}
                            <section className="mt-6">
                                <h3 className="text-base font-semibold">
                                    {t("reconcile.sectionToDisable", { count: candidates.length })}
                                </h3>
                                <p className="text-base-content/60 text-xs mt-1">
                                    {t("reconcile.sectionToDisableDesc")}
                                </p>
                                <CandidateTable rows={candidates} />
                            </section>

                            <section className="mt-6">
                                <h3 className="text-base font-semibold">
                                    {t("reconcile.sectionDrift", { count: drifts.length })}
                                </h3>
                                <p className="text-base-content/60 text-xs mt-1">
                                    <Trans
                                        i18nKey="reconcile.sectionDriftDesc"
                                        components={{ code: <code className="font-mono" /> }}
                                    />
                                </p>
                                <DriftTable rows={drifts} />
                            </section>

                            <section className="mt-6">
                                <h3 className="text-base font-semibold">
                                    {t("reconcile.sectionTransfer", { count: transfers.length })}
                                </h3>
                                <p className="text-base-content/60 text-xs mt-1">
                                    {t("reconcile.sectionTransferDesc")}
                                </p>
                                <TransferTable rows={transfers} />
                            </section>

                            {result && (
                                <section className="mt-6">
                                    <h3 className="text-base font-semibold">{t("reconcile.sectionOutcomes")}</h3>
                                    <OutcomeTable rows={result.disableOutcomes} />
                                </section>
                            )}

                            {!result && candidates.length > 0 && (
                                <div className="alert alert-warning mt-6">
                                    <span className="iconify lucide--alert-triangle size-4" />
                                    <div className="text-sm">
                                        <p className="font-medium">{t("reconcile.confirmListTitle")}</p>
                                        <ul className="ms-4 mt-1 list-disc">
                                            <li>{t("reconcile.confirmDisable", { count: candidates.length })}</li>
                                            <li>
                                                <Trans
                                                    i18nKey="reconcile.confirmMarkPg"
                                                    components={{ code: <code className="font-mono" /> }}
                                                />
                                            </li>
                                            <li>
                                                {t("reconcile.confirmTransferNoop", { count: transfers.length })}
                                            </li>
                                            <li>{t("reconcile.confirmAuditMail")}</li>
                                        </ul>
                                    </div>
                                </div>
                            )}

                            <div className="modal-action mt-4">
                                {result ? (
                                    <button className="btn btn-primary" onClick={onReset}>
                                        {t("reconcile.rescan")}
                                    </button>
                                ) : (
                                    <button
                                        className="btn btn-warning"
                                        onClick={() => setConfirming(true)}
                                        disabled={!hasActions || run.isPending}>
                                        {run.isPending ? (
                                            <>
                                                <span className="loading loading-spinner loading-sm" />
                                                {t("reconcile.running")}
                                            </>
                                        ) : (
                                            <>
                                                <span className="iconify lucide--user-x size-4" />
                                                {t("reconcile.runButton")}
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Confirm dialog */}
            {confirming && (
                <dialog open className="modal">
                    <div className="modal-box">
                        <h3 className="text-lg font-semibold">{t("reconcile.confirmDialogTitle")}</h3>
                        <ul className="mt-2 ms-4 list-disc text-sm">
                            <li>
                                <Trans
                                    i18nKey="reconcile.confirmDialogDisable"
                                    values={{ count: candidates.length }}
                                    components={{ warn: <span className="text-warning font-medium" /> }}
                                />
                            </li>
                            <li>
                                <Trans
                                    i18nKey="reconcile.confirmDialogDrift"
                                    values={{ count: drifts.length }}
                                    components={{ err: <span className="text-error font-medium" /> }}
                                />
                            </li>
                            <li>{t("reconcile.confirmDialogMail")}</li>
                        </ul>
                        <p className="text-base-content/60 mt-3 text-xs">{t("reconcile.confirmDialogNote")}</p>
                        <div className="modal-action">
                            <button className="btn btn-ghost" onClick={() => setConfirming(false)}>
                                {t("common.cancel")}
                            </button>
                            <button className="btn btn-warning" onClick={onConfirm}>
                                {t("reconcile.confirmRun")}
                            </button>
                        </div>
                    </div>
                    <form method="dialog" className="modal-backdrop" onClick={() => setConfirming(false)}>
                        <button type="button">close</button>
                    </form>
                </dialog>
            )}
        </>
    );
};

export default ReconcilePage;

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { ApiError } from "@/lib/api";
import { useDryRunProvision, useProvisionStaged } from "@/lib/hooks/useStagedUsers";
import {
    isGroupProvisionResponse,
    type AnyProvisionResponse,
    type GroupProvisionResponse,
    type MemberOutcome,
    type MemberStatus,
    type StagedUser,
} from "@/lib/types";

type Props = {
    user: StagedUser;
    onClose: () => void;
};

const narrowToGroup = (r: AnyProvisionResponse | undefined): GroupProvisionResponse | null =>
    r && isGroupProvisionResponse(r) ? r : null;

const statusBadge: Record<MemberStatus, { labelKey: string; cls: string; icon: string }> = {
    AlreadyProvisioned: {
        labelKey: "stagedUsers.groupDialog.memberStatus.alreadyProvisioned",
        cls: "badge-success",
        icon: "lucide--check",
    },
    Provisioned: {
        labelKey: "stagedUsers.groupDialog.memberStatus.provisioned",
        cls: "badge-info",
        icon: "lucide--user-plus",
    },
    AdoptedExisting: {
        labelKey: "stagedUsers.groupDialog.memberStatus.adoptedExisting",
        cls: "badge-warning",
        icon: "lucide--link-2",
    },
    Skipped: {
        labelKey: "stagedUsers.groupDialog.memberStatus.skipped",
        cls: "badge-ghost",
        icon: "lucide--minus",
    },
    Failed: {
        labelKey: "stagedUsers.groupDialog.memberStatus.failed",
        cls: "badge-error",
        icon: "lucide--alert-triangle",
    },
};

const StatusBadge = ({ status }: { status: MemberStatus }) => {
    const { t } = useTranslation();
    const s = statusBadge[status];
    return (
        <span className={`badge ${s.cls} gap-1`}>
            <span className={`iconify ${s.icon} size-3`} />
            {t(s.labelKey)}
        </span>
    );
};

const MemberTable = ({ members }: { members: MemberOutcome[] }) => {
    const { t } = useTranslation();
    return (
        <div className="mt-4 max-h-[40vh] overflow-y-auto">
            <table className="table table-sm">
                <thead className="bg-base-200 sticky top-0">
                    <tr>
                        <th>{t("stagedUsers.groupDialog.memberTable.status")}</th>
                        <th>{t("stagedUsers.groupDialog.memberTable.mail")}</th>
                        <th>{t("stagedUsers.groupDialog.memberTable.display")}</th>
                        <th>{t("stagedUsers.groupDialog.memberTable.ou")}</th>
                        <th>{t("stagedUsers.groupDialog.memberTable.email")}</th>
                    </tr>
                </thead>
                <tbody>
                    {members.map((m) => (
                        <tr key={m.mail}>
                            <td>
                                <StatusBadge status={m.status} />
                            </td>
                            <td className="font-mono text-xs">{m.mail}</td>
                            <td>{m.displayName}</td>
                            <td className="text-base-content/70 text-xs">{m.parentOu}</td>
                            <td className="text-xs">
                                {m.emailSent ? (
                                    <span className="text-success inline-flex items-center gap-1">
                                        <span className="iconify lucide--mail-check size-3.5" />{" "}
                                        {t("stagedUsers.groupDialog.memberTable.sent")}
                                    </span>
                                ) : m.status === "AlreadyProvisioned" || m.status === "AdoptedExisting" ? (
                                    <span className="text-base-content/40">—</span>
                                ) : m.status === "Provisioned" ? (
                                    <span className="text-warning">
                                        {t("stagedUsers.groupDialog.memberTable.queued")}
                                    </span>
                                ) : (
                                    <span className="text-base-content/40">—</span>
                                )}
                            </td>
                        </tr>
                    ))}
                    {members.length === 0 && (
                        <tr>
                            <td colSpan={5} className="text-base-content/50 py-6 text-center text-xs">
                                {t("stagedUsers.groupDialog.noMembers")}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export const ProvisionGroupDialog = ({ user, onClose }: Props) => {
    const { t } = useTranslation();
    const dialogRef = useRef<HTMLDialogElement>(null);
    const dryRunQuery = useDryRunProvision(user.mail);
    const provision = useProvisionStaged();
    const [resultRaw, setResultRaw] = useState<AnyProvisionResponse | null>(null);
    const [acknowledged, setAcknowledged] = useState(false);

    useEffect(() => {
        dialogRef.current?.showModal();
    }, []);

    const handleConfirm = () => {
        provision.mutate(user.mail, {
            onSuccess: (data) => setResultRaw(data),
        });
    };

    const handleClose = () => {
        dialogRef.current?.close();
        onClose();
    };

    const error = (dryRunQuery.error ?? provision.error) as ApiError | Error | null;
    const dryRun = narrowToGroup(dryRunQuery.data);
    const result = narrowToGroup(resultRaw ?? undefined);

    const stage: "loading-preview" | "preview" | "provisioning" | "result" | "error" =
        error && !result
            ? "error"
            : result
              ? "result"
              : provision.isPending
                ? "provisioning"
                : dryRun
                  ? "preview"
                  : "loading-preview";

    const memberStats = useMemo(() => {
        const list = result?.members ?? dryRun?.members ?? [];
        return {
            total: list.length,
            already: list.filter((m) => m.status === "AlreadyProvisioned").length,
            willProvision: list.filter((m) => m.status === "Provisioned").length,
            adopted: list.filter((m) => m.status === "AdoptedExisting").length,
            skipped: list.filter((m) => m.status === "Skipped").length,
            failed: list.filter((m) => m.status === "Failed").length,
            emailed: list.filter((m) => m.emailSent).length,
        };
    }, [dryRun, result]);

    return (
        <dialog ref={dialogRef} className="modal" onClose={onClose}>
            <div className="modal-box w-11/12 max-w-4xl">
                {stage === "loading-preview" && (
                    <div className="flex flex-col items-center gap-3 py-10">
                        <span className="loading loading-spinner loading-lg text-primary" />
                        <p className="text-base-content/70 text-sm">
                            {t("stagedUsers.groupDialog.generatingPreview")}
                        </p>
                    </div>
                )}

                {stage === "error" && (
                    <>
                        <h3 className="text-lg font-semibold">{t("stagedUsers.groupDialog.cannotProvision")}</h3>
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
                        <div className="modal-action">
                            <button className="btn" onClick={handleClose}>
                                {t("common.close")}
                            </button>
                        </div>
                    </>
                )}

                {(stage === "preview" || stage === "provisioning") && dryRun && (
                    <>
                        <h3 className="text-lg font-semibold">
                            {t("stagedUsers.groupDialog.previewTitle", { mail: user.mail })}
                        </h3>
                        <p className="text-base-content/60 mt-1 text-sm">
                            {t("stagedUsers.groupDialog.previewSubtitle")}
                        </p>

                        <div className="bg-base-200 rounded-box mt-4 overflow-hidden">
                            <table className="table table-sm">
                                <tbody>
                                    <tr>
                                        <td className="text-base-content/60 w-48 font-mono text-xs">sAMAccountName</td>
                                        <td className="font-mono text-xs">{dryRun.spec.samAccountName}</td>
                                    </tr>
                                    <tr>
                                        <td className="text-base-content/60 font-mono text-xs">name (CN)</td>
                                        <td className="font-mono text-xs">{dryRun.spec.name}</td>
                                    </tr>
                                    <tr>
                                        <td className="text-base-content/60 font-mono text-xs">displayName</td>
                                        <td className="font-mono text-xs">{dryRun.spec.displayName}</td>
                                    </tr>
                                    <tr>
                                        <td className="text-base-content/60 font-mono text-xs">mail</td>
                                        <td className="font-mono text-xs">{dryRun.spec.mail ?? "—"}</td>
                                    </tr>
                                    <tr>
                                        <td className="text-base-content/60 font-mono text-xs">description</td>
                                        <td className="font-mono text-xs">{dryRun.spec.description ?? "—"}</td>
                                    </tr>
                                    <tr>
                                        <td className="text-base-content/60 font-mono text-xs">groupType</td>
                                        <td className="font-mono text-xs">Global Security (0x80000002)</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                            <span className="font-medium">
                                {t("stagedUsers.groupDialog.statsSuggested", { count: memberStats.total })}
                            </span>
                            <span className="text-success">
                                {t("stagedUsers.groupDialog.statsAlready", { count: memberStats.already })}
                            </span>
                            <span className="text-info">
                                {t("stagedUsers.groupDialog.statsWillProvision", {
                                    count: memberStats.willProvision,
                                })}
                            </span>
                            {memberStats.adopted > 0 && (
                                <span className="text-warning">
                                    {t("stagedUsers.groupDialog.statsAdopted", { count: memberStats.adopted })}
                                </span>
                            )}
                            {memberStats.skipped > 0 && (
                                <span className="text-base-content/60">
                                    {t("stagedUsers.groupDialog.statsSkipped", { count: memberStats.skipped })}
                                </span>
                            )}
                        </div>

                        <MemberTable members={dryRun.members} />

                        <div className="alert alert-warning mt-4">
                            <span className="iconify lucide--alert-triangle size-4" />
                            <div className="text-sm">
                                <p className="font-medium">{t("stagedUsers.groupDialog.confirmListTitle")}</p>
                                <ul className="ms-4 mt-1 list-disc">
                                    <li>{t("stagedUsers.groupDialog.confirmCreateGroup")}</li>
                                    <li>
                                        {t("stagedUsers.groupDialog.confirmProvisionMembers", {
                                            count: memberStats.willProvision,
                                        })}
                                    </li>
                                    {memberStats.adopted > 0 && (
                                        <li>
                                            {t("stagedUsers.groupDialog.confirmAdoptMembers", {
                                                count: memberStats.adopted,
                                            })}
                                        </li>
                                    )}
                                    <li>{t("stagedUsers.groupDialog.confirmSendMail")}</li>
                                    <li>
                                        {t("stagedUsers.groupDialog.confirmAddMembers", {
                                            count: memberStats.total,
                                        })}
                                    </li>
                                </ul>
                                <p className="mt-2 text-xs">{t("stagedUsers.groupDialog.smtpDisabledNote")}</p>
                            </div>
                        </div>

                        <div className="modal-action">
                            <button
                                className="btn btn-ghost"
                                onClick={handleClose}
                                disabled={stage === "provisioning"}>
                                {t("common.cancel")}
                            </button>
                            <button
                                className="btn btn-primary gap-2"
                                onClick={handleConfirm}
                                disabled={stage === "provisioning"}>
                                {stage === "provisioning" ? (
                                    <>
                                        <span className="loading loading-spinner loading-sm" />
                                        {t("stagedUsers.groupDialog.cascadeProvisioning")}
                                    </>
                                ) : (
                                    <>
                                        <span className="iconify lucide--check size-4" />
                                        {t("stagedUsers.groupDialog.confirmCascade")}
                                    </>
                                )}
                            </button>
                        </div>
                    </>
                )}

                {stage === "result" && result && (
                    <>
                        <div className="flex items-center gap-2">
                            <span className="iconify lucide--check-circle-2 text-success size-6" />
                            <h3 className="text-lg font-semibold">{t("stagedUsers.groupDialog.resultTitle")}</h3>
                        </div>
                        <p className="text-base-content/70 mt-2 text-sm">
                            {t("stagedUsers.groupDialog.resultGroupLabel")}
                            <span className="font-mono">
                                {" "}
                                {result.provisionedGroup?.group.distinguishedName ?? "(missing)"}
                            </span>
                        </p>

                        <div className="stats stats-vertical lg:stats-horizontal bg-base-200 mt-4 w-full shadow-none">
                            <div className="stat py-3">
                                <div className="stat-title text-xs">{t("stagedUsers.groupDialog.statTotal")}</div>
                                <div className="stat-value text-2xl">{memberStats.total}</div>
                            </div>
                            <div className="stat py-3">
                                <div className="stat-title text-xs">
                                    {t("stagedUsers.groupDialog.statProvisioned")}
                                </div>
                                <div className="stat-value text-info text-2xl">{memberStats.willProvision}</div>
                            </div>
                            {memberStats.adopted > 0 && (
                                <div className="stat py-3">
                                    <div className="stat-title text-xs">
                                        {t("stagedUsers.groupDialog.statAdopted")}
                                    </div>
                                    <div className="stat-value text-warning text-2xl">{memberStats.adopted}</div>
                                </div>
                            )}
                            <div className="stat py-3">
                                <div className="stat-title text-xs">{t("stagedUsers.groupDialog.statAlready")}</div>
                                <div className="stat-value text-success text-2xl">{memberStats.already}</div>
                            </div>
                            <div className="stat py-3">
                                <div className="stat-title text-xs">{t("stagedUsers.groupDialog.statEmailed")}</div>
                                <div className="stat-value text-2xl">{memberStats.emailed}</div>
                            </div>
                            {memberStats.failed > 0 && (
                                <div className="stat py-3">
                                    <div className="stat-title text-xs">
                                        {t("stagedUsers.groupDialog.statFailed")}
                                    </div>
                                    <div className="stat-value text-error text-2xl">{memberStats.failed}</div>
                                </div>
                            )}
                        </div>

                        <MemberTable members={result.members} />

                        {memberStats.failed > 0 && (
                            <div className="alert alert-error mt-3 text-xs">
                                <span className="iconify lucide--alert-triangle size-4" />
                                <span>
                                    {t("stagedUsers.groupDialog.failedAlert", { count: memberStats.failed })}
                                </span>
                            </div>
                        )}

                        {memberStats.willProvision > 0 && memberStats.emailed === 0 && (
                            <div className="alert alert-warning mt-3 text-xs">
                                <span className="iconify lucide--mail-x size-4" />
                                <span>{t("stagedUsers.groupDialog.noEmailAlert")}</span>
                            </div>
                        )}

                        <label className="mt-4 flex items-center gap-3">
                            <input
                                type="checkbox"
                                className="checkbox checkbox-sm checkbox-primary"
                                checked={acknowledged}
                                onChange={(e) => setAcknowledged(e.target.checked)}
                            />
                            <span className="text-sm">{t("stagedUsers.groupDialog.acknowledged")}</span>
                        </label>

                        <div className="modal-action">
                            <button className="btn btn-primary" onClick={handleClose} disabled={!acknowledged}>
                                {t("common.close")}
                            </button>
                        </div>
                    </>
                )}
            </div>
            <form method="dialog" className="modal-backdrop">
                <button>close</button>
            </form>
        </dialog>
    );
};

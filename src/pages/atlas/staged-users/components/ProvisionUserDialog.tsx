import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { ApiError } from "@/lib/api";
import { useDryRunProvision, useProvisionStaged } from "@/lib/hooks/useStagedUsers";
import {
    isGroupProvisionResponse,
    type AnyProvisionResponse,
    type ProvisionResponse,
    type StagedUser,
} from "@/lib/types";

type Props = {
    user: StagedUser;
    onClose: () => void;
};

const narrowToUser = (r: AnyProvisionResponse | undefined): ProvisionResponse | null =>
    r && !isGroupProvisionResponse(r) ? r : null;

export const ProvisionUserDialog = ({ user, onClose }: Props) => {
    const { t } = useTranslation();
    const dialogRef = useRef<HTMLDialogElement>(null);
    const dryRunQuery = useDryRunProvision(user.mail);
    const provision = useProvisionStaged();
    const [resultRaw, setResultRaw] = useState<AnyProvisionResponse | null>(null);
    const [acknowledged, setAcknowledged] = useState(false);
    const [revealPassword, setRevealPassword] = useState(false);

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

    const copyPassword = async (pw: string) => {
        try {
            await navigator.clipboard.writeText(pw);
        } catch {
            /* clipboard may fail on http; user can still read it */
        }
    };

    const error = (dryRunQuery.error ?? provision.error) as ApiError | Error | null;
    const dryRun = narrowToUser(dryRunQuery.data);
    const result = narrowToUser(resultRaw ?? undefined);

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

    return (
        <dialog ref={dialogRef} className="modal" onClose={onClose}>
            <div className="modal-box max-w-2xl">
                {stage === "loading-preview" && (
                    <div className="flex flex-col items-center gap-3 py-10">
                        <span className="loading loading-spinner loading-lg text-primary" />
                        <p className="text-base-content/70 text-sm">{t("stagedUsers.userDialog.generatingPreview")}</p>
                    </div>
                )}

                {stage === "error" && (
                    <>
                        <h3 className="text-lg font-semibold">{t("stagedUsers.userDialog.cannotProvision")}</h3>
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
                            {t("stagedUsers.userDialog.previewTitle", { mail: user.mail })}
                        </h3>
                        <p className="text-base-content/60 mt-1 text-sm">
                            {t("stagedUsers.userDialog.previewSubtitle")}
                        </p>
                        <div className="bg-base-200 rounded-box mt-4 overflow-hidden">
                            <table className="table table-sm">
                                <tbody>
                                    {Object.entries({
                                        samAccountName: dryRun.spec.samAccountName,
                                        userPrincipalName: dryRun.spec.userPrincipalName,
                                        displayName: dryRun.spec.displayName,
                                        givenName: dryRun.spec.givenName ?? "—",
                                        surname: dryRun.spec.surname ?? t("stagedUsers.userDialog.surnameSkipped"),
                                        mail: dryRun.spec.mail ?? "—",
                                        department: dryRun.spec.department ?? "—",
                                        title: dryRun.spec.title ?? "—",
                                    }).map(([k, v]) => (
                                        <tr key={k}>
                                            <td className="text-base-content/60 w-48 font-mono text-xs">{k}</td>
                                            <td className="font-mono text-xs">{v}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="alert alert-warning mt-4">
                            <span className="iconify lucide--alert-triangle size-4" />
                            <span className="text-sm">{t("stagedUsers.userDialog.confirmWarning")}</span>
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
                                        {t("stagedUsers.userDialog.provisioning")}
                                    </>
                                ) : (
                                    <>
                                        <span className="iconify lucide--check size-4" />
                                        {t("stagedUsers.userDialog.confirmWrite")}
                                    </>
                                )}
                            </button>
                        </div>
                    </>
                )}

                {stage === "result" && result?.provisioned && (
                    <>
                        <div className="flex items-center gap-2">
                            <span className="iconify lucide--check-circle-2 text-success size-6" />
                            <h3 className="text-lg font-semibold">{t("stagedUsers.userDialog.provisionedTitle")}</h3>
                        </div>
                        <p className="text-base-content/70 mt-2 text-sm">
                            {t("stagedUsers.userDialog.accountCreated")}
                            <span className="font-mono">{result.provisioned.user.userPrincipalName}</span>
                        </p>

                        <div className="alert alert-warning mt-4">
                            <span className="iconify lucide--key-round size-5" />
                            <div className="flex-1">
                                <p className="font-medium">{t("stagedUsers.userDialog.initialPassword")}</p>
                                <div className="bg-base-100 mt-2 flex items-center gap-2 rounded-md border p-2">
                                    <code className="grow font-mono text-sm">
                                        {revealPassword ? result.provisioned.initialPassword : "•".repeat(16)}
                                    </code>
                                    <button
                                        className="btn btn-xs btn-ghost btn-circle"
                                        onClick={() => setRevealPassword((v) => !v)}
                                        aria-label="Toggle password visibility">
                                        <span
                                            className={`iconify ${revealPassword ? "lucide--eye-off" : "lucide--eye"} size-4`}
                                        />
                                    </button>
                                    <button
                                        className="btn btn-xs btn-ghost btn-circle"
                                        onClick={() => copyPassword(result.provisioned!.initialPassword)}
                                        aria-label="Copy password">
                                        <span className="iconify lucide--clipboard size-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-base-200 rounded-box mt-4 p-3 text-xs">
                            <p>
                                <span className="text-base-content/60">{t("stagedUsers.userDialog.dn")}</span>{" "}
                                <span className="font-mono">{result.provisioned.user.distinguishedName}</span>
                            </p>
                            <p className="mt-1">
                                <span className="text-base-content/60">
                                    {t("stagedUsers.userDialog.mustChangePassword")}
                                </span>{" "}
                                {result.provisioned.mustChangePasswordAtNextLogon
                                    ? t("common.yes")
                                    : t("common.no")}
                            </p>
                            <p className="mt-1">
                                <span className="text-base-content/60">
                                    {t("stagedUsers.userDialog.emailNotice")}
                                </span>{" "}
                                {result.emailSent ? (
                                    <span className="text-success inline-flex items-center gap-1">
                                        <span className="iconify lucide--mail-check size-3.5" />
                                        {t("stagedUsers.userDialog.emailSentTo", { mail: user.mail })}
                                    </span>
                                ) : result.emailError ? (
                                    <span className="text-error inline-flex items-center gap-1">
                                        <span className="iconify lucide--mail-x size-3.5" />
                                        {t("stagedUsers.userDialog.emailFailed", { error: result.emailError })}
                                    </span>
                                ) : (
                                    <span className="text-warning inline-flex items-center gap-1">
                                        <span className="iconify lucide--mail-off size-3.5" />
                                        {t("stagedUsers.userDialog.emailNotSent")}
                                    </span>
                                )}
                            </p>
                        </div>

                        <label className="mt-4 flex items-center gap-3">
                            <input
                                type="checkbox"
                                className="checkbox checkbox-sm checkbox-primary"
                                checked={acknowledged}
                                onChange={(e) => setAcknowledged(e.target.checked)}
                            />
                            <span className="text-sm">{t("stagedUsers.userDialog.acknowledged")}</span>
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

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { ApiError } from "@/lib/api";
import { useResetPassword } from "@/lib/hooks/useStagedUsers";
import type { ResetPasswordResponse, StagedUser } from "@/lib/types";

type Props = {
    user: StagedUser;
    onClose: () => void;
};

export const ResetPasswordDialog = ({ user, onClose }: Props) => {
    const { t } = useTranslation();
    const dialogRef = useRef<HTMLDialogElement>(null);
    const reset = useResetPassword();

    const [mode, setMode] = useState<"auto" | "manual">("auto");
    const [manualPassword, setManualPassword] = useState("");
    const [mustChange, setMustChange] = useState(true);
    const [result, setResult] = useState<ResetPasswordResponse | null>(null);
    const [revealPassword, setRevealPassword] = useState(false);
    const [acknowledged, setAcknowledged] = useState(false);

    useEffect(() => {
        dialogRef.current?.showModal();
    }, []);

    const handleClose = () => {
        dialogRef.current?.close();
        onClose();
    };

    const handleConfirm = () => {
        reset.mutate(
            {
                mail: user.mail,
                request: {
                    mode,
                    password: mode === "manual" ? manualPassword : null,
                    mustChangeAtNextLogon: mustChange,
                },
            },
            { onSuccess: (data) => setResult(data) },
        );
    };

    const copyPassword = async (pw: string) => {
        try {
            await navigator.clipboard.writeText(pw);
        } catch {
            /* clipboard may fail on http; user can still read it */
        }
    };

    const error = reset.error as ApiError | Error | null;
    const manualMissing = mode === "manual" && manualPassword.trim() === "";

    return (
        <dialog ref={dialogRef} className="modal" onClose={onClose}>
            <div className="modal-box max-w-lg">
                {/* Form stage */}
                {!result && (
                    <>
                        <h3 className="text-lg font-semibold">{t("stagedUsers.resetPassword.title", { mail: user.mail })}</h3>

                        <div className="mt-5">
                            <h4 className="text-sm font-medium">{t("stagedUsers.resetPassword.modeLabel")}</h4>
                            <div className="mt-3 space-y-2">
                                <label className="border-base-300 rounded-box flex cursor-pointer items-start gap-3 border p-3">
                                    <input
                                        type="radio"
                                        name="reset-mode"
                                        className="radio radio-primary radio-sm mt-0.5"
                                        checked={mode === "auto"}
                                        onChange={() => setMode("auto")}
                                    />
                                    <div>
                                        <p className="font-medium">{t("stagedUsers.resetPassword.modeAuto")}</p>
                                        <p className="text-base-content/60 text-xs">
                                            {t("stagedUsers.resetPassword.modeAutoDesc")}
                                        </p>
                                    </div>
                                </label>
                                <label className="border-base-300 rounded-box flex cursor-pointer items-start gap-3 border p-3">
                                    <input
                                        type="radio"
                                        name="reset-mode"
                                        className="radio radio-primary radio-sm mt-0.5"
                                        checked={mode === "manual"}
                                        onChange={() => setMode("manual")}
                                    />
                                    <div>
                                        <p className="font-medium">{t("stagedUsers.resetPassword.modeManual")}</p>
                                        <p className="text-base-content/60 text-xs">
                                            {t("stagedUsers.resetPassword.modeManualDesc")}
                                        </p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {mode === "manual" && (
                            <fieldset className="fieldset mt-4">
                                <legend className="fieldset-legend">
                                    {t("stagedUsers.resetPassword.manualPasswordLabel")}
                                </legend>
                                <label className="input w-full focus:outline-0">
                                    <span className="iconify lucide--key-round text-base-content/60 size-4" />
                                    <input
                                        className="grow focus:outline-0"
                                        type="password"
                                        autoComplete="new-password"
                                        value={manualPassword}
                                        placeholder={t("stagedUsers.resetPassword.manualPasswordPlaceholder")}
                                        onChange={(e) => setManualPassword(e.target.value)}
                                    />
                                </label>
                                <p className="text-base-content/50 mt-1 text-xs">
                                    {t("stagedUsers.resetPassword.manualPasswordHint")}
                                </p>
                            </fieldset>
                        )}

                        <label className="mt-4 flex items-center gap-3">
                            <input
                                type="checkbox"
                                className="checkbox checkbox-sm checkbox-primary"
                                checked={mustChange}
                                onChange={(e) => setMustChange(e.target.checked)}
                            />
                            <span className="text-sm">{t("stagedUsers.resetPassword.mustChange")}</span>
                        </label>

                        {error && (
                            <div className="alert alert-error mt-4">
                                <span className="iconify lucide--alert-triangle size-5" />
                                <div>
                                    <p className="font-medium">
                                        {error instanceof ApiError
                                            ? `${error.status} ${error.title}`
                                            : t("stagedUsers.resetPassword.failTitle")}
                                    </p>
                                    {error instanceof ApiError && error.detail && (
                                        <p className="mt-1 text-sm">{error.detail}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="modal-action">
                            <button className="btn btn-ghost" onClick={handleClose} disabled={reset.isPending}>
                                {t("common.cancel")}
                            </button>
                            <button
                                className="btn btn-primary gap-2"
                                onClick={handleConfirm}
                                disabled={reset.isPending || manualMissing}>
                                {reset.isPending ? (
                                    <>
                                        <span className="loading loading-spinner loading-sm" />
                                        {t("stagedUsers.resetPassword.resetting")}
                                    </>
                                ) : (
                                    <>
                                        <span className="iconify lucide--check size-4" />
                                        {t("stagedUsers.resetPassword.confirm")}
                                    </>
                                )}
                            </button>
                        </div>
                    </>
                )}

                {/* Result stage */}
                {result && (
                    <>
                        <div className="flex items-center gap-2">
                            <span className="iconify lucide--check-circle-2 text-success size-6" />
                            <h3 className="text-lg font-semibold">{t("stagedUsers.resetPassword.successTitle")}</h3>
                        </div>

                        <div className="alert alert-warning mt-4">
                            <span className="iconify lucide--key-round size-5" />
                            <div className="flex-1">
                                <p className="font-medium">{t("stagedUsers.resetPassword.newPassword")}</p>
                                <div className="bg-base-100 mt-2 flex items-center gap-2 rounded-md border p-2">
                                    <code className="grow font-mono text-sm">
                                        {revealPassword ? result.newPassword : "•".repeat(16)}
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
                                        onClick={() => copyPassword(result.newPassword)}
                                        aria-label="Copy password">
                                        <span className="iconify lucide--clipboard size-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-base-200 rounded-box mt-4 p-3 text-xs">
                            <p>
                                <span className="text-base-content/60">
                                    {t("stagedUsers.resetPassword.mustChangeResult")}
                                </span>{" "}
                                {result.mustChangeAtNextLogon ? t("common.yes") : t("common.no")}
                            </p>
                        </div>

                        <label className="mt-4 flex items-center gap-3">
                            <input
                                type="checkbox"
                                className="checkbox checkbox-sm checkbox-primary"
                                checked={acknowledged}
                                onChange={(e) => setAcknowledged(e.target.checked)}
                            />
                            <span className="text-sm">{t("stagedUsers.resetPassword.acknowledged")}</span>
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

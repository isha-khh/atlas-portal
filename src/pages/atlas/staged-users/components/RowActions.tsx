import { useRef, useState } from "react";
import { Trans, useTranslation } from "react-i18next";

import {
    useDeselectStaged,
    useDisableStaged,
    useSelectStaged,
    useUnprovisionStaged,
} from "@/lib/hooks/useStagedUsers";
import type { StagedUser } from "@/lib/types";

import { ResetPasswordDialog } from "./ResetPasswordDialog";

type Props = {
    user: StagedUser;
    onProvision: (user: StagedUser) => void;
};

export const RowActions = ({ user, onProvision }: Props) => {
    const { t } = useTranslation();
    const select = useSelectStaged();
    const deselect = useDeselectStaged();
    const disable = useDisableStaged();
    const unprovision = useUnprovisionStaged();
    const unprovisionDialogRef = useRef<HTMLDialogElement>(null);
    const [resetOpen, setResetOpen] = useState(false);

    if (user.adState === "unselected") {
        return (
            <button
                className="btn btn-xs btn-ghost gap-1"
                disabled={select.isPending}
                onClick={() => select.mutate(user.mail)}>
                {select.isPending ? (
                    <span className="loading loading-spinner loading-xs" />
                ) : (
                    <span className="iconify lucide--circle-dot size-3.5" />
                )}
                {t("stagedUsers.actions.select")}
            </button>
        );
    }

    if (user.adState === "selected") {
        return (
            <div className="flex items-center gap-1">
                <button
                    className="btn btn-xs btn-primary gap-1"
                    onClick={() => onProvision(user)}
                    title={user.kind === "group" ? t("stagedUsers.actions.cascadeTitle") : undefined}>
                    <span
                        className={`iconify size-3.5 ${
                            user.kind === "group" ? "lucide--users-round" : "lucide--user-plus"
                        }`}
                    />
                    {user.kind === "group"
                        ? t("stagedUsers.actions.provisionCascade")
                        : t("stagedUsers.actions.provision")}
                </button>
                <button
                    className="btn btn-xs btn-ghost"
                    disabled={deselect.isPending}
                    onClick={() => deselect.mutate(user.mail)}
                    title={t("stagedUsers.actions.deselect")}>
                    {deselect.isPending ? (
                        <span className="loading loading-spinner loading-xs" />
                    ) : (
                        <span className="iconify lucide--undo-2 size-3.5" />
                    )}
                </button>
            </div>
        );
    }

    if (user.adState === "provisioned" || user.adState === "disabled") {
        return (
            <>
                <div className="flex items-center gap-1">
                    {user.adState === "provisioned" && (
                        <>
                            <button
                                className="btn btn-xs btn-ghost gap-1"
                                onClick={() => setResetOpen(true)}
                                title={t("stagedUsers.actions.resetPasswordTitle")}>
                                <span className="iconify lucide--key-round size-3.5" />
                                {t("stagedUsers.actions.resetPassword")}
                            </button>
                            <button
                                className="btn btn-xs btn-ghost gap-1"
                                disabled={disable.isPending}
                                onClick={() => disable.mutate(user.mail)}
                                title={t("stagedUsers.actions.disableTitle")}>
                                {disable.isPending ? (
                                    <span className="loading loading-spinner loading-xs" />
                                ) : (
                                    <span className="iconify lucide--ban size-3.5" />
                                )}
                                {t("stagedUsers.actions.disable")}
                            </button>
                        </>
                    )}
                    <button
                        className="btn btn-xs btn-ghost text-error hover:bg-error/10 gap-1"
                        onClick={() => unprovisionDialogRef.current?.showModal()}
                        title={t("stagedUsers.actions.unprovisionTitle")}>
                        <span className="iconify lucide--trash-2 size-3.5" />
                        {t("stagedUsers.actions.unprovision")}
                    </button>
                </div>

                <dialog ref={unprovisionDialogRef} className="modal">
                    <div className="modal-box max-w-md">
                        <h3 className="text-lg font-semibold">{t("stagedUsers.actions.unprovisionConfirmTitle")}</h3>
                        <p className="text-base-content/70 mt-3 text-sm">
                            <Trans
                                i18nKey="stagedUsers.actions.unprovisionBody"
                                values={{ sam: user.adSam, mail: user.mail }}
                                components={{
                                    del: <span className="text-error font-medium" />,
                                    mono: <span className="font-mono" />,
                                }}
                            />
                        </p>
                        <ul className="text-base-content/60 mt-3 list-disc ps-5 text-xs">
                            <li>{t("stagedUsers.actions.unprovisionPoint1")}</li>
                            <li>{t("stagedUsers.actions.unprovisionPoint2")}</li>
                            <li>{t("stagedUsers.actions.unprovisionPoint3")}</li>
                        </ul>
                        <div className="modal-action">
                            <form method="dialog">
                                <button className="btn btn-ghost">{t("common.cancel")}</button>
                            </form>
                            <button
                                className="btn btn-error gap-2"
                                disabled={unprovision.isPending}
                                onClick={() => {
                                    unprovision.mutate(user.mail, {
                                        onSuccess: () => unprovisionDialogRef.current?.close(),
                                    });
                                }}>
                                {unprovision.isPending ? (
                                    <>
                                        <span className="loading loading-spinner loading-sm" />
                                        {t("stagedUsers.actions.unprovisioning")}
                                    </>
                                ) : (
                                    <>
                                        <span className="iconify lucide--trash-2 size-4" />
                                        {t("stagedUsers.actions.confirmDelete")}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                    <form method="dialog" className="modal-backdrop">
                        <button>close</button>
                    </form>
                </dialog>

                {resetOpen && <ResetPasswordDialog user={user} onClose={() => setResetOpen(false)} />}
            </>
        );
    }

    return <span className="text-base-content/40 text-xs">—</span>;
};

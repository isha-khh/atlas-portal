import { useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";

import { MetaData } from "@/components/MetaData";
import { PageTitle } from "@/components/PageTitle";
import { ApiError } from "@/lib/api";
import {
    usePasswordPolicy,
    useReconcileAdmins,
    useSmtpSettings,
    useUpdatePasswordPolicy,
    useUpdateReconcileAdmins,
    useUpdateSmtpSettings,
} from "@/lib/hooks/useSettings";
import type {
    PasswordPolicyMode,
    ReconcileAdminsView,
    SmtpSettingsView,
} from "@/lib/types";

type FormState = {
    smtpServer: string;
    port: number;
    userName: string;
    password: string;
    enableSsl: boolean;
    isEnabled: boolean;
    senderName: string;
    senderEmail: string;
};

const fromView = (v: SmtpSettingsView): FormState => ({
    smtpServer: v.smtpServer,
    port: v.port,
    userName: v.userName,
    password: "", // never pre-fill — operator types only when rotating
    enableSsl: v.enableSsl,
    isEnabled: v.isEnabled,
    senderName: v.senderName,
    senderEmail: v.senderEmail,
});

const SettingsPage = () => {
    const { t } = useTranslation();
    const query = useSmtpSettings();
    const update = useUpdateSmtpSettings();
    const [form, setForm] = useState<FormState | null>(null);
    const [savedAt, setSavedAt] = useState<Date | null>(null);

    useEffect(() => {
        if (query.data && form === null) {
            setForm(fromView(query.data));
        }
    }, [query.data, form]);

    const handleChange = <K extends keyof FormState>(key: K, value: FormState[K]) => {
        setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    };

    const handleSave = () => {
        if (!form) return;
        update.mutate(
            {
                smtpServer: form.smtpServer.trim(),
                port: form.port,
                userName: form.userName.trim(),
                password: form.password ? form.password : null, // null = preserve
                enableSsl: form.enableSsl,
                isEnabled: form.isEnabled,
                senderName: form.senderName.trim(),
                senderEmail: form.senderEmail.trim(),
            },
            {
                onSuccess: (data) => {
                    setForm(fromView(data));
                    setSavedAt(new Date());
                },
            },
        );
    };

    const handleReset = () => {
        if (query.data) setForm(fromView(query.data));
        update.reset();
        setSavedAt(null);
    };

    const hasPasswordStored = query.data?.hasPassword ?? false;

    return (
        <>
            <MetaData title={t("settings.title")} />
            <div className="p-5 md:p-6">
                <PageTitle
                    title={t("settings.title")}
                    items={[{ label: t("nav.atlas") }, { label: t("settings.title"), active: true }]}
                />

                <div className="card bg-base-100 mt-5 p-4 md:p-6">
                    <div className="flex items-center gap-3">
                        <span className="iconify lucide--mail size-5" />
                        <h2 className="text-lg font-medium">{t("settings.smtp.heading")}</h2>
                    </div>
                    <p className="text-base-content/60 mt-1 text-sm">
                        <Trans
                            i18nKey="settings.smtp.desc"
                            components={{ mono: <span className="font-mono" /> }}
                        />
                    </p>

                    {query.isLoading && (
                        <div className="flex items-center gap-2 py-6">
                            <span className="loading loading-spinner loading-sm" />
                            <span className="text-base-content/70 text-sm">{t("settings.smtp.loading")}</span>
                        </div>
                    )}

                    {query.isError && (
                        <div className="alert alert-error mt-4">
                            <span className="iconify lucide--alert-triangle size-4" />
                            <span className="text-sm">
                                {query.error instanceof ApiError
                                    ? `${query.error.status} ${query.error.title}: ${query.error.detail ?? ""}`
                                    : (query.error as Error).message}
                            </span>
                        </div>
                    )}

                    {form && (
                        <div className="mt-6 space-y-6">
                            {/* IsEnabled — prominent */}
                            <div className="bg-base-200 rounded-box p-4">
                                <label className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        className="toggle toggle-primary"
                                        checked={form.isEnabled}
                                        onChange={(e) => handleChange("isEnabled", e.target.checked)}
                                    />
                                    <div>
                                        <p className="font-medium">{t("settings.smtp.enableToggle")}</p>
                                        <p className="text-base-content/60 text-xs">
                                            {t("settings.smtp.enableDesc")}
                                        </p>
                                    </div>
                                </label>
                            </div>

                            {/* Server */}
                            <div>
                                <h3 className="text-sm font-medium">{t("settings.smtp.serverSection")}</h3>
                                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                                    <Field
                                        label={t("settings.smtp.serverLabel")}
                                        icon="lucide--server"
                                        value={form.smtpServer}
                                        onChange={(v) => handleChange("smtpServer", v)}
                                        placeholder="smtp.isha.org.tw"
                                    />
                                    <Field
                                        label={t("settings.smtp.portLabel")}
                                        icon="lucide--hash"
                                        type="number"
                                        value={String(form.port)}
                                        onChange={(v) => handleChange("port", Number(v) || 0)}
                                        placeholder="587"
                                    />
                                </div>
                                <label className="mt-3 flex items-center gap-3 text-sm">
                                    <input
                                        type="checkbox"
                                        className="toggle toggle-sm"
                                        checked={form.enableSsl}
                                        onChange={(e) => handleChange("enableSsl", e.target.checked)}
                                    />
                                    {t("settings.smtp.enableSsl")}
                                </label>
                            </div>

                            {/* Credentials */}
                            <div>
                                <h3 className="text-sm font-medium">{t("settings.smtp.credentialsSection")}</h3>
                                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                                    <Field
                                        label={t("settings.smtp.userNameLabel")}
                                        icon="lucide--user"
                                        value={form.userName}
                                        onChange={(v) => handleChange("userName", v)}
                                        placeholder="isha_khh"
                                    />
                                    <Field
                                        label={t("settings.smtp.passwordLabel")}
                                        icon="lucide--key-round"
                                        type="password"
                                        value={form.password}
                                        onChange={(v) => handleChange("password", v)}
                                        placeholder={
                                            hasPasswordStored
                                                ? t("settings.smtp.passwordPlaceholderStored")
                                                : t("settings.smtp.passwordPlaceholderEmpty")
                                        }
                                        hint={
                                            hasPasswordStored
                                                ? t("settings.smtp.passwordHintStored")
                                                : t("settings.smtp.passwordHintEmpty")
                                        }
                                    />
                                </div>
                            </div>

                            {/* Sender */}
                            <div>
                                <h3 className="text-sm font-medium">{t("settings.smtp.senderSection")}</h3>
                                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                                    <Field
                                        label={t("settings.smtp.senderNameLabel")}
                                        icon="lucide--id-card"
                                        value={form.senderName}
                                        onChange={(v) => handleChange("senderName", v)}
                                        placeholder="Atlas Provisioning"
                                    />
                                    <Field
                                        label={t("settings.smtp.senderEmailLabel")}
                                        icon="lucide--at-sign"
                                        type="email"
                                        value={form.senderEmail}
                                        onChange={(v) => handleChange("senderEmail", v)}
                                        placeholder="isha_khh@mail.isha.org.tw"
                                    />
                                </div>
                            </div>

                            {/* Save error */}
                            {update.isError && (
                                <div className="alert alert-error">
                                    <span className="iconify lucide--alert-triangle size-4" />
                                    <span className="text-sm">
                                        {update.error instanceof ApiError
                                            ? `${update.error.status} ${update.error.title}: ${update.error.detail ?? ""}`
                                            : (update.error as Error).message}
                                    </span>
                                </div>
                            )}

                            {/* Save success */}
                            {savedAt && !update.isError && !update.isPending && (
                                <div className="alert alert-success">
                                    <span className="iconify lucide--check size-4" />
                                    <span className="text-sm">
                                        {t("common.savedAt", { time: savedAt.toLocaleTimeString() })}
                                    </span>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={handleReset}
                                    disabled={update.isPending}>
                                    {t("common.reset")}
                                </button>
                                <button
                                    className="btn btn-primary btn-sm gap-2"
                                    onClick={handleSave}
                                    disabled={update.isPending}>
                                    {update.isPending ? (
                                        <>
                                            <span className="loading loading-spinner loading-xs" />
                                            {t("common.saving")}
                                        </>
                                    ) : (
                                        <>
                                            <span className="iconify lucide--save size-4" />
                                            {t("common.save")}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <PasswordPolicySection />

                <ReconcileAdminsSection />
            </div>
        </>
    );
};

const PasswordPolicySection = () => {
    const { t } = useTranslation();
    const query = usePasswordPolicy();
    const update = useUpdatePasswordPolicy();
    const [mode, setMode] = useState<PasswordPolicyMode | null>(null);
    const [fixedPassword, setFixedPassword] = useState("");
    const [savedAt, setSavedAt] = useState<Date | null>(null);

    useEffect(() => {
        if (query.data && mode === null) {
            setMode(query.data.mode);
        }
    }, [query.data, mode]);

    const hasStored = query.data?.hasFixedPassword ?? false;

    const handleSave = () => {
        if (!mode) return;
        update.mutate(
            {
                mode,
                // blank keeps existing (server preserves); only matters for fixed mode
                fixedPassword: fixedPassword ? fixedPassword : null,
            },
            {
                onSuccess: (data) => {
                    setMode(data.mode);
                    setFixedPassword("");
                    setSavedAt(new Date());
                },
            },
        );
    };

    const handleReset = () => {
        if (query.data) setMode(query.data.mode);
        setFixedPassword("");
        update.reset();
        setSavedAt(null);
    };

    // Block saving fixed mode with no password anywhere (mirrors server guard).
    const fixedMissingPassword = mode === "fixed" && !hasStored && fixedPassword.trim() === "";

    return (
        <div className="card bg-base-100 mt-5 p-4 md:p-6">
            <div className="flex items-center gap-3">
                <span className="iconify lucide--key-round size-5" />
                <h2 className="text-lg font-medium">{t("settings.passwordPolicy.heading")}</h2>
            </div>
            <p className="text-base-content/60 mt-1 text-sm">
                <Trans
                    i18nKey="settings.passwordPolicy.desc"
                    components={{ mono: <span className="font-mono" /> }}
                />
            </p>

            {query.isLoading && (
                <div className="flex items-center gap-2 py-6">
                    <span className="loading loading-spinner loading-sm" />
                    <span className="text-base-content/70 text-sm">
                        {t("settings.passwordPolicy.loading")}
                    </span>
                </div>
            )}

            {query.isError && (
                <div className="alert alert-error mt-4">
                    <span className="iconify lucide--alert-triangle size-4" />
                    <span className="text-sm">
                        {query.error instanceof ApiError
                            ? `${query.error.status} ${query.error.title}: ${query.error.detail ?? ""}`
                            : (query.error as Error).message}
                    </span>
                </div>
            )}

            {mode !== null && (
                <div className="mt-6 space-y-5">
                    <div>
                        <h3 className="text-sm font-medium">{t("settings.passwordPolicy.modeLabel")}</h3>
                        <div className="mt-3 space-y-2">
                            <label className="border-base-300 rounded-box flex cursor-pointer items-start gap-3 border p-3">
                                <input
                                    type="radio"
                                    name="pw-mode"
                                    className="radio radio-primary radio-sm mt-0.5"
                                    checked={mode === "random"}
                                    onChange={() => setMode("random")}
                                />
                                <div>
                                    <p className="font-medium">{t("settings.passwordPolicy.modeRandom")}</p>
                                    <p className="text-base-content/60 text-xs">
                                        {t("settings.passwordPolicy.modeRandomDesc")}
                                    </p>
                                </div>
                            </label>
                            <label className="border-base-300 rounded-box flex cursor-pointer items-start gap-3 border p-3">
                                <input
                                    type="radio"
                                    name="pw-mode"
                                    className="radio radio-primary radio-sm mt-0.5"
                                    checked={mode === "fixed"}
                                    onChange={() => setMode("fixed")}
                                />
                                <div>
                                    <p className="font-medium">{t("settings.passwordPolicy.modeFixed")}</p>
                                    <p className="text-base-content/60 text-xs">
                                        {t("settings.passwordPolicy.modeFixedDesc")}
                                    </p>
                                </div>
                            </label>
                        </div>
                    </div>

                    {mode === "fixed" && (
                        <div>
                            <Field
                                label={t("settings.passwordPolicy.fixedPasswordLabel")}
                                icon="lucide--key-round"
                                type="password"
                                value={fixedPassword}
                                onChange={setFixedPassword}
                                placeholder={
                                    hasStored
                                        ? t("settings.passwordPolicy.fixedPasswordPlaceholderStored")
                                        : t("settings.passwordPolicy.fixedPasswordPlaceholderEmpty")
                                }
                                hint={t("settings.passwordPolicy.fixedPasswordHint")}
                            />
                            <div className="alert alert-warning mt-3">
                                <span className="iconify lucide--shield-alert size-4" />
                                <span className="text-xs">
                                    {t("settings.passwordPolicy.complexityWarning")}
                                </span>
                            </div>
                        </div>
                    )}

                    {update.isError && (
                        <div className="alert alert-error">
                            <span className="iconify lucide--alert-triangle size-4" />
                            <span className="text-sm">
                                {update.error instanceof ApiError
                                    ? `${update.error.status} ${update.error.title}: ${update.error.detail ?? ""}`
                                    : (update.error as Error).message}
                            </span>
                        </div>
                    )}

                    {savedAt && !update.isError && !update.isPending && (
                        <div className="alert alert-success">
                            <span className="iconify lucide--check size-4" />
                            <span className="text-sm">
                                {t("common.savedAt", { time: savedAt.toLocaleTimeString() })}
                            </span>
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={handleReset}
                            disabled={update.isPending}>
                            {t("common.reset")}
                        </button>
                        <button
                            className="btn btn-primary btn-sm gap-2"
                            onClick={handleSave}
                            disabled={update.isPending || fixedMissingPassword}>
                            {update.isPending ? (
                                <>
                                    <span className="loading loading-spinner loading-xs" />
                                    {t("common.saving")}
                                </>
                            ) : (
                                <>
                                    <span className="iconify lucide--save size-4" />
                                    {t("common.save")}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const ReconcileAdminsSection = () => {
    const { t } = useTranslation();
    const query = useReconcileAdmins();
    const update = useUpdateReconcileAdmins();
    const [draft, setDraft] = useState<ReconcileAdminsView | null>(null);
    const [pending, setPending] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [savedAt, setSavedAt] = useState<Date | null>(null);

    useEffect(() => {
        if (query.data && draft === null) {
            setDraft({ emails: [...query.data.emails], notifyOnEmpty: query.data.notifyOnEmpty });
        }
    }, [query.data, draft]);

    const addEmail = () => {
        if (!draft) return;
        const trimmed = pending.trim();
        if (!trimmed) return;
        if (!trimmed.includes("@")) {
            setError(t("settings.reconcileAdmins.invalidEmail", { value: trimmed }));
            return;
        }
        if (draft.emails.some((e) => e.toLowerCase() === trimmed.toLowerCase())) {
            setError(t("settings.reconcileAdmins.duplicateEmail", { value: trimmed }));
            return;
        }
        setError(null);
        setDraft({ ...draft, emails: [...draft.emails, trimmed] });
        setPending("");
    };

    const removeEmail = (idx: number) => {
        if (!draft) return;
        setDraft({ ...draft, emails: draft.emails.filter((_, i) => i !== idx) });
    };

    const handleSave = () => {
        if (!draft) return;
        setError(null);
        update.mutate(draft, {
            onSuccess: (data) => {
                setDraft({ emails: [...data.emails], notifyOnEmpty: data.notifyOnEmpty });
                setSavedAt(new Date());
            },
        });
    };

    const handleReset = () => {
        if (query.data) {
            setDraft({ emails: [...query.data.emails], notifyOnEmpty: query.data.notifyOnEmpty });
        }
        setPending("");
        setError(null);
        update.reset();
        setSavedAt(null);
    };

    return (
        <div className="card bg-base-100 mt-5 p-4 md:p-6">
            <div className="flex items-center gap-3">
                <span className="iconify lucide--users-round size-5" />
                <h2 className="text-lg font-medium">{t("settings.reconcileAdmins.heading")}</h2>
            </div>
            <p className="text-base-content/60 mt-1 text-sm">
                <Trans
                    i18nKey="settings.reconcileAdmins.desc"
                    components={{ mono: <span className="font-mono" /> }}
                />
            </p>

            {query.isLoading && (
                <div className="flex items-center gap-2 py-6">
                    <span className="loading loading-spinner loading-sm" />
                    <span className="text-base-content/70 text-sm">
                        {t("settings.reconcileAdmins.loading")}
                    </span>
                </div>
            )}

            {query.isError && (
                <div className="alert alert-error mt-4">
                    <span className="iconify lucide--alert-triangle size-4" />
                    <span className="text-sm">
                        {query.error instanceof ApiError
                            ? `${query.error.status} ${query.error.title}: ${query.error.detail ?? ""}`
                            : (query.error as Error).message}
                    </span>
                </div>
            )}

            {draft && (
                <div className="mt-6 space-y-6">
                    <div>
                        <h3 className="text-sm font-medium">
                            {t("settings.reconcileAdmins.emailsLabel", { count: draft.emails.length })}
                        </h3>
                        <div className="bg-base-200 rounded-box mt-3 flex flex-wrap gap-2 p-3">
                            {draft.emails.map((e, i) => (
                                <span key={e} className="badge badge-lg badge-neutral gap-2">
                                    <span className="font-mono text-xs">{e}</span>
                                    <button
                                        type="button"
                                        className="hover:text-error"
                                        onClick={() => removeEmail(i)}
                                        aria-label={`Remove ${e}`}>
                                        <span className="iconify lucide--x size-3" />
                                    </button>
                                </span>
                            ))}
                            {draft.emails.length === 0 && (
                                <span className="text-base-content/50 px-1 text-xs">
                                    {t("settings.reconcileAdmins.emptyNote")}
                                </span>
                            )}
                        </div>

                        <div className="mt-3 flex gap-2">
                            <label className="input w-full focus:outline-0">
                                <span className="iconify lucide--at-sign text-base-content/60 size-4" />
                                <input
                                    className="grow focus:outline-0"
                                    type="email"
                                    placeholder="admin@isha.org.tw"
                                    value={pending}
                                    onChange={(e) => {
                                        setPending(e.target.value);
                                        if (error) setError(null);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            addEmail();
                                        }
                                    }}
                                />
                            </label>
                            <button className="btn btn-ghost gap-1" onClick={addEmail}>
                                <span className="iconify lucide--plus size-4" />
                                {t("common.add")}
                            </button>
                        </div>
                        {error && <p className="text-error mt-1 text-xs">{error}</p>}
                    </div>

                    <div className="bg-base-200 rounded-box p-4">
                        <label className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                className="toggle toggle-primary"
                                checked={draft.notifyOnEmpty}
                                onChange={(e) =>
                                    setDraft({ ...draft, notifyOnEmpty: e.target.checked })
                                }
                            />
                            <div>
                                <p className="font-medium">{t("settings.reconcileAdmins.notifyOnEmpty")}</p>
                                <p className="text-base-content/60 text-xs">
                                    {t("settings.reconcileAdmins.notifyOnEmptyDesc")}
                                </p>
                            </div>
                        </label>
                    </div>

                    {update.isError && (
                        <div className="alert alert-error">
                            <span className="iconify lucide--alert-triangle size-4" />
                            <span className="text-sm">
                                {update.error instanceof ApiError
                                    ? `${update.error.status} ${update.error.title}: ${update.error.detail ?? ""}`
                                    : (update.error as Error).message}
                            </span>
                        </div>
                    )}

                    {savedAt && !update.isError && !update.isPending && (
                        <div className="alert alert-success">
                            <span className="iconify lucide--check size-4" />
                            <span className="text-sm">
                                {t("common.savedAt", { time: savedAt.toLocaleTimeString() })}
                            </span>
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={handleReset}
                            disabled={update.isPending}>
                            {t("common.reset")}
                        </button>
                        <button
                            className="btn btn-primary btn-sm gap-2"
                            onClick={handleSave}
                            disabled={update.isPending}>
                            {update.isPending ? (
                                <>
                                    <span className="loading loading-spinner loading-xs" />
                                    {t("common.saving")}
                                </>
                            ) : (
                                <>
                                    <span className="iconify lucide--save size-4" />
                                    {t("common.save")}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

type FieldProps = {
    label: string;
    icon: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
    hint?: string;
};

const Field = ({ label, icon, value, onChange, placeholder, type = "text", hint }: FieldProps) => (
    <fieldset className="fieldset">
        <legend className="fieldset-legend">{label}</legend>
        <label className="input w-full focus:outline-0">
            <span className={`iconify ${icon} text-base-content/60 size-4`} />
            <input
                className="grow focus:outline-0"
                type={type}
                value={value}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
                autoComplete={type === "password" ? "new-password" : "off"}
            />
        </label>
        {hint && <p className="text-base-content/50 mt-1 text-xs">{hint}</p>}
    </fieldset>
);

export default SettingsPage;

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";

import { MetaData } from "@/components/MetaData";
import { PageTitle } from "@/components/PageTitle";
import { ApiError } from "@/lib/api";
import { useStagedUsers } from "@/lib/hooks/useStagedUsers";
import type { AdState, StagedUser, StagedUserKind } from "@/lib/types";

import { ProvisionDialog } from "./components/ProvisionDialog";
import { RowActions } from "./components/RowActions";
import { StateBadge } from "./components/StateBadge";

type StateFilter = AdState | "all";
type KindFilter = StagedUserKind | "all";

const stateFilters: { labelKey: string; value: StateFilter }[] = [
    { labelKey: "stagedUsers.filters.all", value: "all" },
    { labelKey: "stagedUsers.filters.unselected", value: "unselected" },
    { labelKey: "stagedUsers.filters.selected", value: "selected" },
    { labelKey: "stagedUsers.filters.provisioned", value: "provisioned" },
    { labelKey: "stagedUsers.filters.disabled", value: "disabled" },
];

const kindFilters: { labelKey: string; value: KindFilter; icon: string }[] = [
    { labelKey: "stagedUsers.filters.all", value: "all", icon: "lucide--rows-3" },
    { labelKey: "stagedUsers.filters.person", value: "person", icon: "lucide--user" },
    { labelKey: "stagedUsers.filters.group", value: "group", icon: "lucide--users" },
];

const StagedUsersPage = () => {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const [stateFilter, setStateFilter] = useState<StateFilter>("all");
    const [kindFilter, setKindFilter] = useState<KindFilter>("all");
    const [search, setSearch] = useState(searchParams.get("q") ?? "");
    const [provisionTarget, setProvisionTarget] = useState<StagedUser | null>(null);

    // Topbar 搜尋跳轉 /staged-users?q=… — 已在本頁時 URL 變了也要帶進搜尋框
    useEffect(() => {
        const q = searchParams.get("q");
        if (q !== null) setSearch(q);
    }, [searchParams]);

    const query = useStagedUsers(stateFilter === "all" ? null : stateFilter);

    const visibleRows = useMemo(() => {
        if (!query.data) return [];
        const q = search.trim().toLowerCase();
        return query.data.filter((u) => {
            if (kindFilter !== "all" && u.kind !== kindFilter) return false;
            if (!q) return true;
            return (
                u.mail.toLowerCase().includes(q) ||
                (u.cn ?? "").toLowerCase().includes(q) ||
                (u.preview.displayName ?? "").toLowerCase().includes(q)
            );
        });
    }, [query.data, search, kindFilter]);

    const groupCount = useMemo(
        () => query.data?.filter((u) => u.kind === "group").length ?? 0,
        [query.data],
    );

    return (
        <>
            <MetaData title={t("stagedUsers.title")} />
            <div className="p-5 md:p-6">
                <PageTitle
                    title={t("stagedUsers.title")}
                    items={[{ label: t("nav.atlas") }, { label: t("stagedUsers.title"), active: true }]}
                />

                <div className="card bg-base-100 mt-5 p-4 md:p-6">
                    {/* State filter pills + search */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="join">
                            {stateFilters.map((f) => (
                                <button
                                    key={f.value}
                                    className={`btn btn-sm join-item ${
                                        stateFilter === f.value ? "btn-primary" : "btn-ghost border-base-300"
                                    }`}
                                    onClick={() => setStateFilter(f.value)}>
                                    {t(f.labelKey)}
                                </button>
                            ))}
                        </div>

                        <label className="input input-sm border-base-300 ms-auto w-full max-w-xs gap-2">
                            <span className="iconify lucide--search text-base-content/60 size-4" />
                            <input
                                type="search"
                                className="grow"
                                placeholder={t("stagedUsers.searchPlaceholder")}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </label>

                        <button
                            className="btn btn-sm btn-ghost btn-circle"
                            onClick={() => query.refetch()}
                            disabled={query.isFetching}
                            aria-label={t("common.refresh")}
                            title={t("common.refresh")}>
                            <span
                                className={`iconify lucide--refresh-cw size-4 ${
                                    query.isFetching ? "animate-spin" : ""
                                }`}
                            />
                        </button>
                    </div>

                    {/* Kind filter pills + status row */}
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                        <div className="join">
                            {kindFilters.map((f) => (
                                <button
                                    key={f.value}
                                    className={`btn btn-xs join-item gap-1 ${
                                        kindFilter === f.value ? "btn-secondary" : "btn-ghost border-base-300"
                                    }`}
                                    onClick={() => setKindFilter(f.value)}>
                                    <span className={`iconify ${f.icon} size-3.5`} />
                                    {t(f.labelKey)}
                                </button>
                            ))}
                        </div>

                        <div className="text-base-content/60 ms-auto text-xs">
                            {query.isLoading && t("common.loading")}
                            {query.isError &&
                                (() => {
                                    const err = query.error as ApiError | Error;
                                    if (err instanceof ApiError && err.status === 503) return null;
                                    return (
                                        <span className="text-error">
                                            {t("stagedUsers.loadFailed", { message: err.message })}
                                        </span>
                                    );
                                })()}
                            {query.data && (
                                <span>
                                    {t("stagedUsers.showing", {
                                        visible: visibleRows.length,
                                        total: query.data.length,
                                    })}
                                    {stateFilter !== "all" && ` · ${stateFilter}`}
                                    {kindFilter !== "all" && ` · ${kindFilter}`}
                                    {groupCount > 0 && kindFilter !== "group" && (
                                        <span className="text-base-content/40 ms-2">
                                            {t("stagedUsers.groupNote", { count: groupCount })}
                                        </span>
                                    )}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* 503: provisioning disabled banner */}
                    {query.isError &&
                        query.error instanceof ApiError &&
                        query.error.status === 503 && (
                            <div className="alert alert-warning mt-3">
                                <span className="iconify lucide--alert-triangle size-4" />
                                <span className="text-sm">{t("stagedUsers.provisioningDisabled")}</span>
                            </div>
                        )}

                    {/* Table */}
                    <div className="mt-4 overflow-x-auto">
                        <table className="table-zebra table">
                            <thead>
                                <tr>
                                    <th className="w-12">{t("stagedUsers.table.kind")}</th>
                                    <th className="w-32">{t("stagedUsers.table.state")}</th>
                                    <th>{t("stagedUsers.table.mail")}</th>
                                    <th>{t("stagedUsers.table.display")}</th>
                                    <th>{t("stagedUsers.table.ou")}</th>
                                    <th>{t("stagedUsers.table.adSam")}</th>
                                    <th className="w-48">{t("stagedUsers.table.actions")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleRows.map((u) => (
                                    <tr key={u.mail}>
                                        <td>
                                            <span
                                                className={`iconify size-4 ${
                                                    u.kind === "group"
                                                        ? "lucide--users text-warning"
                                                        : "lucide--user text-base-content/60"
                                                }`}
                                                title={u.kind}
                                            />
                                        </td>
                                        <td>
                                            <StateBadge state={u.adState} />
                                        </td>
                                        <td className="font-mono text-xs">{u.mail}</td>
                                        <td>{u.preview.displayName}</td>
                                        <td className="text-base-content/70 text-xs">{u.parentOu}</td>
                                        <td className="font-mono text-xs">
                                            {u.adSam ?? (
                                                <span className="text-base-content/40">
                                                    {u.preview.samAccountName}
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <RowActions user={u} onProvision={setProvisionTarget} />
                                        </td>
                                    </tr>
                                ))}
                                {!query.isLoading && visibleRows.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="text-base-content/50 py-12 text-center">
                                            {query.data?.length === 0
                                                ? t("stagedUsers.emptyNoUsers")
                                                : t("stagedUsers.emptyNoMatch")}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {provisionTarget && (
                <ProvisionDialog
                    user={provisionTarget}
                    onClose={() => setProvisionTarget(null)}
                />
            )}
        </>
    );
};

export default StagedUsersPage;

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { apiFetch } from "@/lib/api";
import { useApiToken } from "@/lib/hooks/useApiToken";
import type { StagedUser } from "@/lib/types";

const PAGES: { labelKey: string; url: string; icon: string }[] = [
    { labelKey: "nav.stagedUsers", url: "/staged-users", icon: "lucide--user-plus" },
    { labelKey: "nav.reconcile", url: "/reconcile", icon: "lucide--refresh-cw" },
    { labelKey: "nav.sync", url: "/sync", icon: "lucide--cloud-download" },
    { labelKey: "nav.settings", url: "/settings", icon: "lucide--settings" },
];

const MAX_USER_RESULTS = 8;

type ResultItem =
    | { type: "page"; label: string; url: string; icon: string }
    | { type: "user"; user: StagedUser };

/**
 * Ctrl+K command palette — 搜 staged users(mail / 顯示名稱 / cn)+ 頁面跳轉。
 * staged-users 查詢只在 palette 打開後啟用,queryKey 跟列表頁共用快取。
 * 選帳號 → /staged-users?q=<mail>(列表頁讀 ?q= 帶入搜尋框)。
 */
export const TopbarSearchButton = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const token = useApiToken();
    const dialogRef = useRef<HTMLDialogElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState(0);

    const usersQuery = useQuery({
        queryKey: ["staged-users", "list", "all"],
        queryFn: ({ signal }) => apiFetch<StagedUser[]>("/api/staged-users", { token, signal }),
        enabled: Boolean(token) && open,
        staleTime: 60_000,
    });

    const showModal = () => {
        setOpen(true);
        setQuery("");
        setSelected(0);
        dialogRef.current?.showModal();
        // dialog 打開後 autofocus 不一定生效,手動補
        requestAnimationFrame(() => inputRef.current?.focus());
    };

    const closeModal = () => {
        dialogRef.current?.close();
    };

    // Ctrl+K / Cmd+K 全域快捷鍵
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                if (dialogRef.current?.open) closeModal();
                else showModal();
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const results = useMemo<ResultItem[]>(() => {
        const q = query.trim().toLowerCase();
        const pages: ResultItem[] = PAGES.map((p) => ({
            type: "page" as const,
            label: t(p.labelKey),
            url: p.url,
            icon: p.icon,
        })).filter((p) => !q || p.label.toLowerCase().includes(q));

        if (!q) return pages;

        const users: ResultItem[] = (usersQuery.data ?? [])
            .filter(
                (u) =>
                    u.mail.toLowerCase().includes(q) ||
                    (u.cn ?? "").toLowerCase().includes(q) ||
                    (u.preview.displayName ?? "").toLowerCase().includes(q),
            )
            .slice(0, MAX_USER_RESULTS)
            .map((u) => ({ type: "user" as const, user: u }));

        return [...pages, ...users];
    }, [query, usersQuery.data, t]);

    // query 變了把選取拉回第一筆
    useEffect(() => setSelected(0), [query]);

    const go = (item: ResultItem) => {
        closeModal();
        if (item.type === "page") {
            navigate(item.url);
        } else {
            navigate(`/staged-users?q=${encodeURIComponent(item.user.mail)}`);
        }
    };

    const onInputKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelected((i) => Math.min(i + 1, results.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelected((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            const item = results[selected];
            if (item) go(item);
        }
    };

    const q = query.trim();
    const pageItems = results.filter((r) => r.type === "page");
    const userItems = results.filter((r) => r.type === "user");

    const renderRow = (item: ResultItem, index: number) => {
        const active = index === selected;
        const base = `flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-start ${
            active ? "bg-base-200" : "hover:bg-base-200/50"
        }`;
        if (item.type === "page") {
            return (
                <button key={`page-${item.url}`} type="button" className={base} onMouseEnter={() => setSelected(index)} onClick={() => go(item)}>
                    <span className={`iconify ${item.icon} text-base-content/70 size-4`} />
                    <span className="grow text-sm">{item.label}</span>
                    <span className="iconify lucide--corner-down-left text-base-content/40 size-3.5" />
                </button>
            );
        }
        const u = item.user;
        return (
            <button key={`user-${u.mail}`} type="button" className={base} onMouseEnter={() => setSelected(index)} onClick={() => go(item)}>
                <span
                    className={`iconify size-4 ${
                        u.kind === "group" ? "lucide--users text-warning" : "lucide--user text-base-content/60"
                    }`}
                />
                <span className="grow">
                    <span className="block text-sm leading-tight">{u.preview.displayName ?? u.mail}</span>
                    <span className="text-base-content/60 block font-mono text-xs">{u.mail}</span>
                </span>
                <span className="badge badge-ghost badge-sm">{t(`stagedUsers.state.${u.adState}`)}</span>
            </button>
        );
    };

    return (
        <>
            <button
                className="btn btn-outline btn-sm btn-ghost border-base-300 text-base-content/70 hidden h-9 w-48 justify-start gap-2 !text-sm md:flex"
                onClick={showModal}>
                <span className="iconify lucide--search size-4" />
                <span className="grow text-start">{t("search.button")}</span>
                <kbd className="kbd kbd-xs">Ctrl K</kbd>
            </button>
            <button
                className="btn btn-outline btn-sm btn-square btn-ghost border-base-300 text-base-content/70 flex size-9 md:hidden"
                aria-label={t("search.ariaLabel")}
                onClick={showModal}>
                <span className="iconify lucide--search size-4" />
            </button>
            <dialog ref={dialogRef} className="modal p-0" onClose={() => setOpen(false)}>
                <div className="modal-box bg-transparent p-0 shadow-none">
                    <div className="bg-base-100 rounded-box">
                        <div className="input w-full border-0 !outline-none">
                            <span className="iconify lucide--search text-base-content/60 size-4.5" />
                            <input
                                ref={inputRef}
                                type="search"
                                className="grow"
                                placeholder={t("search.placeholder")}
                                aria-label={t("search.ariaLabel")}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={onInputKeyDown}
                            />
                            {usersQuery.isFetching && <span className="loading loading-spinner loading-xs" />}
                            <form method="dialog">
                                <button className="btn btn-xs btn-circle btn-ghost" aria-label={t("common.close")}>
                                    <span className="iconify lucide--x text-base-content/80 size-4" />
                                </button>
                            </form>
                        </div>

                        <div className="border-base-300 max-h-[55vh] overflow-y-auto border-t pb-1">
                            {pageItems.length > 0 && (
                                <>
                                    <p className="text-base-content/50 px-4 pt-3 pb-1 text-xs font-medium">
                                        {t("search.pages")}
                                    </p>
                                    {pageItems.map((item) => renderRow(item, results.indexOf(item)))}
                                </>
                            )}

                            {q ? (
                                <>
                                    <p className="text-base-content/50 px-4 pt-3 pb-1 text-xs font-medium">
                                        {t("search.users")}
                                    </p>
                                    {userItems.map((item) => renderRow(item, results.indexOf(item)))}
                                    {userItems.length === 0 && !usersQuery.isFetching && (
                                        <p className="text-base-content/50 px-4 py-3 text-sm">
                                            {t("search.noResults", { query: q })}
                                        </p>
                                    )}
                                </>
                            ) : (
                                <p className="text-base-content/50 px-4 py-3 text-xs">{t("search.typeHint")}</p>
                            )}
                        </div>

                        <div className="border-base-300 flex items-center gap-3 border-t px-3 py-2">
                            <div className="flex items-center gap-0.5">
                                <kbd className="kbd kbd-xs">↑</kbd>
                                <kbd className="kbd kbd-xs">↓</kbd>
                                <p className="text-base-content/70 ms-1 text-xs">{t("search.navigate")}</p>
                            </div>
                            <div className="flex items-center gap-0.5">
                                <kbd className="kbd kbd-xs">↵</kbd>
                                <p className="text-base-content/70 ms-1 text-xs">{t("search.open")}</p>
                            </div>
                            <div className="ms-auto flex items-center gap-0.5">
                                <kbd className="kbd kbd-xs">esc</kbd>
                                <p className="text-base-content/70 ms-1 text-xs">{t("search.close")}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>
        </>
    );
};

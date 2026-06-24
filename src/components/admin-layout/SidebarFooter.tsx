import { useTranslation } from "react-i18next";
import { useAuth } from "react-oidc-context";
import { Link } from "react-router";

export const SidebarFooter = () => {
    const { t } = useTranslation();
    const auth = useAuth();
    const profile = auth.user?.profile;
    const displayName = profile?.name ?? profile?.preferred_username ?? "User";
    const username = profile?.preferred_username ?? "—";
    const initial = displayName.charAt(0).toUpperCase();

    const onSignOut = () => {
        void auth.signoutRedirect();
    };

    return (
        <div className="dropdown dropdown-top dropdown-end w-full">
            <div
                tabIndex={0}
                role="button"
                className="bg-base-200 hover:bg-base-300 rounded-box mx-2 mt-0 flex cursor-pointer items-center gap-2.5 px-3 py-2 transition-all">
                <div className="avatar avatar-placeholder">
                    <div className="bg-primary text-primary-content mask mask-squircle w-8">
                        <span className="text-sm font-medium">{initial}</span>
                    </div>
                </div>
                <div className="grow -space-y-0.5">
                    <p className="truncate text-sm font-medium">{displayName}</p>
                    <p className="text-base-content/60 truncate text-xs">@{username}</p>
                </div>
                <span className="iconify lucide--chevrons-up-down text-base-content/60 size-4" />
            </div>
            <ul
                role="menu"
                tabIndex={0}
                className="dropdown-content menu bg-base-100 rounded-box shadow-base-content/4 mb-1 w-48 p-1 shadow-[0px_-10px_40px_0px]">
                <li>
                    <Link to="/settings">
                        <span className="iconify lucide--settings size-4" />
                        <span>{t("layout.settings")}</span>
                    </Link>
                </li>
                <li>
                    <button onClick={onSignOut} className="text-error hover:bg-error/10">
                        <span className="iconify lucide--log-out size-4" />
                        <span>{t("layout.signOut")}</span>
                    </button>
                </li>
            </ul>
        </div>
    );
};

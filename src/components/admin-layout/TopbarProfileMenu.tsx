import { useTranslation } from "react-i18next";
import { useAuth } from "react-oidc-context";
import { Link } from "react-router";

export const TopbarProfileMenu = () => {
    const { t } = useTranslation();
    const auth = useAuth();
    const profile = auth.user?.profile;
    const displayName = profile?.name ?? profile?.preferred_username ?? "User";
    const email = profile?.email ?? "";
    const initial = displayName.charAt(0).toUpperCase();

    const onSignOut = () => {
        void auth.signoutRedirect();
    };

    return (
        <div>
            <div className="drawer drawer-end">
                <input id="topbar-profile-drawer" type="checkbox" className="drawer-toggle" />
                <div className="drawer-content">
                    <label htmlFor="topbar-profile-drawer" className="btn btn-ghost max-sm:btn-square gap-2 px-1.5">
                        <div className="avatar avatar-placeholder">
                            <div className="bg-primary text-primary-content mask mask-squircle w-8">
                                <span className="text-sm font-medium">{initial}</span>
                            </div>
                        </div>
                        <div className="text-start max-sm:hidden">
                            <p className="text-sm/none">{displayName}</p>
                            <p className="text-base-content/50 mt-0.5 text-xs/none">{email || "Atlas"}</p>
                        </div>
                    </label>
                </div>
                <div className="drawer-side">
                    <label
                        htmlFor="topbar-profile-drawer"
                        aria-label="close sidebar"
                        className="drawer-overlay"></label>
                    <div className="h-full w-72 p-2 sm:w-84">
                        <div className="bg-base-100 rounded-box relative flex h-full flex-col pt-4 sm:pt-8">
                            <label
                                htmlFor="topbar-profile-drawer"
                                className="btn btn-xs btn-circle btn-ghost absolute start-2 top-2"
                                aria-label="Close">
                                <span className="iconify lucide--x size-4" />
                            </label>

                            <div className="flex flex-col items-center">
                                <div className="avatar avatar-placeholder">
                                    <div className="bg-primary text-primary-content size-20 rounded-full md:size-24">
                                        <span className="text-3xl font-medium">{initial}</span>
                                    </div>
                                </div>

                                <p className="mt-4 text-lg/none font-medium sm:mt-8">{displayName}</p>
                                <p className="text-base-content/60 mt-1 text-sm">{email}</p>
                            </div>

                            <div className="border-base-300 mt-4 grow overflow-auto border-t border-dashed px-2 sm:mt-6">
                                <ul className="menu w-full p-2">
                                    <li className="menu-title">{t("nav.atlas")}</li>
                                    <li>
                                        <Link to="/settings">
                                            <span className="iconify lucide--settings size-4.5" />
                                            <span>{t("layout.settings")}</span>
                                        </Link>
                                    </li>

                                    <li className="menu-title">{t("layout.session")}</li>
                                    {profile?.preferred_username && (
                                        <li>
                                            <div className="text-base-content/60 text-xs">
                                                <span className="iconify lucide--user size-4.5" />
                                                <span className="font-mono">{profile.preferred_username}</span>
                                            </div>
                                        </li>
                                    )}
                                    <li>
                                        <button className="text-error hover:bg-error/10" onClick={onSignOut}>
                                            <span className="iconify lucide--log-out size-4.5" />
                                            <span>{t("layout.signOut")}</span>
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

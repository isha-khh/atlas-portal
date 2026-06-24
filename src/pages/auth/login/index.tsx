import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "react-oidc-context";
import { Link, Navigate } from "react-router";

import { Logo } from "@/components/Logo";
import { MetaData } from "@/components/MetaData";
import { ThemeToggle } from "@/components/ThemeToggle";

const LoginPage = () => {
    const { t } = useTranslation();
    const auth = useAuth();

    // If already authenticated, bounce straight to the app.
    useEffect(() => {
        if (auth.isAuthenticated && !auth.isLoading) {
            // no-op; <Navigate /> below handles this
        }
    }, [auth.isAuthenticated, auth.isLoading]);

    if (auth.isAuthenticated) {
        return <Navigate to="/staged-users" replace />;
    }

    const signingIn = auth.isLoading || auth.activeNavigator === "signinRedirect";

    return (
        <>
            <MetaData title={t("auth.login.metaTitle")} />
            <div className="flex flex-col items-stretch p-6 md:p-8 lg:p-16">
                <div className="flex items-center justify-between">
                    <Link to="/staged-users">
                        <Logo />
                    </Link>
                    <ThemeToggle className="btn btn-circle btn-outline border-base-300" />
                </div>

                <h3 className="mt-8 text-center text-xl font-semibold md:mt-12 lg:mt-24">{t("auth.login.title")}</h3>
                <h3 className="text-base-content/70 mt-2 text-center text-sm">{t("auth.login.subtitle")}</h3>

                {auth.error && (
                    <div className="alert alert-error mt-6">
                        <span className="iconify lucide--alert-triangle size-4" />
                        <span className="text-sm">{auth.error.message}</span>
                    </div>
                )}

                <div className="mt-6 md:mt-10">
                    <button
                        type="button"
                        className="btn btn-primary btn-wide mt-4 max-w-full gap-3 md:mt-6"
                        onClick={() => auth.signinRedirect()}
                        disabled={signingIn}>
                        {signingIn ? (
                            <>
                                <span className="loading loading-spinner loading-sm" />
                                {t("auth.login.signingIn")}
                            </>
                        ) : (
                            <>
                                <span className="iconify lucide--key-round size-4" />
                                {t("auth.login.signInButton")}
                            </>
                        )}
                    </button>

                    <p className="text-base-content/60 mt-6 text-center text-xs">{t("auth.login.footer")}</p>
                </div>
            </div>
        </>
    );
};

export default LoginPage;

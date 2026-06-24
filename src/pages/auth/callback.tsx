import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "react-oidc-context";
import { useNavigate } from "react-router";

import { MetaData } from "@/components/MetaData";
import { consumePostLoginTarget } from "@/lib/auth";

const AuthCallbackPage = () => {
    const { t } = useTranslation();
    const auth = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (auth.isAuthenticated && !auth.isLoading) {
            navigate(consumePostLoginTarget(), { replace: true });
        }
    }, [auth.isAuthenticated, auth.isLoading, navigate]);

    return (
        <>
            <MetaData title={t("auth.callback.metaTitle")} />
            <div className="flex h-screen items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    {auth.error ? (
                        <>
                            <span className="iconify lucide--alert-triangle text-error size-10" />
                            <p className="text-error font-medium">{t("auth.callback.failed")}</p>
                            <p className="text-base-content/60 max-w-md text-center text-sm">{auth.error.message}</p>
                            <button className="btn btn-primary btn-sm mt-3" onClick={() => navigate("/auth/login")}>
                                {t("auth.callback.backToLogin")}
                            </button>
                        </>
                    ) : (
                        <>
                            <span className="loading loading-spinner loading-lg text-primary" />
                            <p className="text-base-content/70 text-sm">{t("auth.callback.processing")}</p>
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default AuthCallbackPage;

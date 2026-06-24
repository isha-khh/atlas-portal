import { type ReactNode } from "react";
import { useAuth } from "react-oidc-context";
import { Navigate, useLocation } from "react-router";

import { stashPostLoginTarget } from "@/lib/auth";

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
    const auth = useAuth();
    const location = useLocation();

    const navigating =
        auth.activeNavigator === "signinSilent" || auth.activeNavigator === "signinRedirect" || auth.isLoading;

    if (navigating) {
        return (
            <div className="flex h-screen items-center justify-center">
                <span className="loading loading-spinner loading-lg text-primary" />
            </div>
        );
    }

    if (auth.error) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-3 px-4 text-center">
                <span className="iconify lucide--alert-triangle text-error size-12" />
                <p className="text-error text-lg font-medium">登入失敗</p>
                <p className="text-base-content/60 max-w-md text-sm">{auth.error.message}</p>
                <button className="btn btn-primary mt-3" onClick={() => auth.signinRedirect()}>
                    重試
                </button>
            </div>
        );
    }

    if (!auth.isAuthenticated) {
        stashPostLoginTarget(location.pathname + location.search);
        return <Navigate to="/auth/login" replace />;
    }

    return <>{children}</>;
};

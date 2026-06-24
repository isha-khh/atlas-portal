import { WebStorageStateStore } from "oidc-client-ts";
import type { AuthProviderProps } from "react-oidc-context";

const POST_LOGIN_KEY = "atlas-portal:post-login";

export const oidcConfig: AuthProviderProps = {
    authority: import.meta.env.VITE_KEYCLOAK_AUTHORITY,
    client_id: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
    redirect_uri: `${window.location.origin}/auth/callback`,
    post_logout_redirect_uri: window.location.origin,
    response_type: "code",
    scope: "openid profile email",
    automaticSilentRenew: true,
    userStore: new WebStorageStateStore({ store: window.localStorage }),
    onSigninCallback: () => {
        // Strip ?code&state from the URL so a refresh doesn't re-trigger the callback.
        // Actual navigation to the originally-requested page happens in the callback page
        // component, which reads POST_LOGIN_KEY.
        window.history.replaceState({}, document.title, "/auth/callback");
    },
};

export const stashPostLoginTarget = (target: string) => {
    if (target && target !== "/auth/login" && target !== "/auth/callback") {
        sessionStorage.setItem(POST_LOGIN_KEY, target);
    }
};

export const consumePostLoginTarget = (): string => {
    const target = sessionStorage.getItem(POST_LOGIN_KEY);
    sessionStorage.removeItem(POST_LOGIN_KEY);
    return target ?? "/staged-users";
};

import { useAuth } from "react-oidc-context";

export const useApiToken = (): string | undefined => {
    const auth = useAuth();
    return auth.user?.access_token;
};

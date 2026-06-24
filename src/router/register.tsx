import { JSX, LazyExoticComponent, lazy } from "react";
import { Navigate, RouteProps } from "react-router";

export type IRoutesProps = {
    path: RouteProps["path"];
    element: RouteProps["element"];
};

const cw = (Component: LazyExoticComponent<() => JSX.Element>) => {
    return <Component />;
};

const atlasRoutes: IRoutesProps[] = [
    {
        path: "/staged-users",
        element: cw(lazy(() => import("@/pages/atlas/staged-users"))),
    },
    {
        path: "/reconcile",
        element: cw(lazy(() => import("@/pages/atlas/reconcile"))),
    },
    {
        path: "/sync",
        element: cw(lazy(() => import("@/pages/atlas/sync"))),
    },
    {
        path: "/settings",
        element: cw(lazy(() => import("@/pages/atlas/settings"))),
    },
];

const componentRoutes: IRoutesProps[] = Object.entries(import.meta.glob("@/pages/components/**/*.tsx")).map(
    ([path, loader]) => {
        const routePath = path
            .replace(/^.*\/pages/, "")
            .replace(/\.tsx$/, "")
            .replace(/\/index$/, "");

        return {
            path: routePath,
            element: cw(lazy(loader as any)),
        };
    },
);

const authRoutes: IRoutesProps[] = [
    {
        path: "/auth/login",
        element: cw(lazy(() => import("@/pages/auth/login"))),
    },
    {
        path: "/auth/callback",
        element: cw(lazy(() => import("@/pages/auth/callback"))),
    },
];

const otherRoutes: IRoutesProps[] = [
    {
        path: "/",
        element: <Navigate to="/staged-users" replace />,
    },
    {
        path: "/ui/*",
        element: <Navigate to="/components/" replace />,
    },
    {
        path: "/*",
        element: cw(lazy(() => import("@/pages/not-found"))),
    },
];

export const registerRoutes = {
    admin: atlasRoutes,
    components: componentRoutes,
    auth: authRoutes,
    other: otherRoutes,
};

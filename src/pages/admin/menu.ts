import { ISidebarMenuItem } from "@/components/admin-layout/SidebarMenuItem";

// label 是 i18n key,SidebarMenuItem 渲染時 t() 翻譯。
export const adminMenuItems: ISidebarMenuItem[] = [
    {
        id: "atlas-label",
        isTitle: true,
        label: "nav.atlas",
    },
    {
        id: "staged-users",
        icon: "lucide--user-plus",
        label: "nav.stagedUsers",
        url: "/staged-users",
    },
    {
        id: "reconcile",
        icon: "lucide--refresh-cw",
        label: "nav.reconcile",
        url: "/reconcile",
    },
    {
        id: "sync",
        icon: "lucide--cloud-download",
        label: "nav.sync",
        url: "/sync",
    },
    {
        id: "settings",
        icon: "lucide--settings",
        label: "nav.settings",
        url: "/settings",
    },
];

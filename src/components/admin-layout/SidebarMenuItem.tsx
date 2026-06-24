import { AnchorHTMLAttributes } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { ISidebarMenuItemBadges, SidebarMenuItemBadges } from "./SidebarMenuItemBadges";

export type ISidebarMenuItem = {
    id: string;
    icon?: string;
    /** i18n key (e.g. "nav.stagedUsers"); plain text also renders as-is when no key matches */
    label: string;
    isTitle?: boolean;
    url?: string;
    linkProp?: AnchorHTMLAttributes<HTMLAnchorElement>;
    children?: ISidebarMenuItem[];
} & ISidebarMenuItemBadges;

export const SidebarMenuItem = ({
    id,
    url,
    children,
    icon,
    isTitle,
    badges,
    linkProp,
    label,
    activated,
    onToggleActivated,
}: ISidebarMenuItem & { activated: Set<string>; onToggleActivated?: (key: string) => void }) => {
    const { t } = useTranslation();
    const selected = activated.has(id);
    const text = t(label);

    if (isTitle) {
        return <p className="menu-label px-2.5 pt-3 pb-1.5 first:pt-0">{text}</p>;
    }

    if (!children) {
        return (
            <Link to={url ?? ""} className={`menu-item ${selected && "active"}`} {...linkProp}>
                {icon && <span className={`iconify ${icon} size-4`} />}
                <span className="grow">{text}</span>
                <SidebarMenuItemBadges badges={badges} />
            </Link>
        );
    }

    return (
        <div className="group collapse">
            <input
                aria-label="Sidemenu item trigger"
                type="checkbox"
                name="sidebar-menu-parent-item"
                checked={selected}
                onChange={() => onToggleActivated?.(id)}
                className="peer"
            />
            <div className="collapse-title px-2.5 py-1.5">
                {icon && <span className={`iconify ${icon} size-4`} />}
                <span className="grow">{text}</span>
                <SidebarMenuItemBadges badges={badges} />
                <span className="iconify lucide--chevron-right arrow-icon size-3.5" />
            </div>
            <div className="collapse-content ms-6.5 !p-0">
                <div className="mt-0.5 space-y-0.5">
                    {children.map((item, index) => (
                        <SidebarMenuItem
                            {...item}
                            key={index}
                            activated={activated}
                            onToggleActivated={onToggleActivated}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

import { useTranslation } from "react-i18next";

import type { AdState } from "@/lib/types";

const styles: Record<AdState, { labelKey: string; cls: string; icon: string }> = {
    unselected: {
        labelKey: "stagedUsers.state.unselected",
        cls: "badge-ghost",
        icon: "lucide--circle",
    },
    selected: {
        labelKey: "stagedUsers.state.selected",
        cls: "badge-info",
        icon: "lucide--circle-dot",
    },
    provisioned: {
        labelKey: "stagedUsers.state.provisioned",
        cls: "badge-success",
        icon: "lucide--check-circle-2",
    },
    disabled: {
        labelKey: "stagedUsers.state.disabled",
        cls: "badge-warning",
        icon: "lucide--ban",
    },
};

export const StateBadge = ({ state }: { state: AdState }) => {
    const { t } = useTranslation();
    const s = styles[state];
    return (
        <span className={`badge ${s.cls} gap-1`}>
            <span className={`iconify ${s.icon} size-3`} />
            {t(s.labelKey)}
        </span>
    );
};

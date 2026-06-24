import type { StagedUser } from "@/lib/types";

import { ProvisionGroupDialog } from "./ProvisionGroupDialog";
import { ProvisionUserDialog } from "./ProvisionUserDialog";

type Props = {
    user: StagedUser;
    onClose: () => void;
};

/**
 * Dispatcher — picks the right dialog based on the row's kind. Both dialogs
 * use the same underlying `/provision` endpoint; the response shape differs
 * (user spec + password vs group spec + member outcomes).
 */
export const ProvisionDialog = ({ user, onClose }: Props) => {
    if (user.kind === "group") {
        return <ProvisionGroupDialog user={user} onClose={onClose} />;
    }
    return <ProvisionUserDialog user={user} onClose={onClose} />;
};

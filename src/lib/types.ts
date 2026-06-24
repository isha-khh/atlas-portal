// Mirrors atlas-ad domain records (StagedUser, AdPreview, NewAdUserSpec, ProvisionResponse).
// Keep in sync with src/ad.api/src/Atlas.Ad.Domain/*.cs.

export type AdState = "unselected" | "selected" | "provisioned" | "disabled";

/** Classifier from atlas-sync — derived from parent_ou naming convention. */
export type StagedUserKind = "person" | "group";

export type AdPreview = {
    samAccountName: string;
    userPrincipalName: string;
    displayName: string;
    department: string;
    title: string | null;
};

export type StagedUser = {
    mail: string;
    dn: string;
    parentOu: string;
    kind: StagedUserKind;
    givenName: string | null;
    surname: string | null;
    cn: string | null;
    title: string | null;
    telephoneNumber: string | null;
    firstSeen: string;
    lastSeen: string;
    isPresent: boolean;
    adState: AdState;
    adSam: string | null;
    adUpn: string | null;
    adDn: string | null;
    selectedAt: string | null;
    provisionedAt: string | null;
    preview: AdPreview;
};

export type NewAdUserSpec = {
    samAccountName: string;
    userPrincipalName: string;
    displayName: string;
    givenName: string | null;
    surname: string | null;
    mail: string | null;
    department: string | null;
    title: string | null;
    employeeNumber: string | null;
};

export type AdUser = {
    samAccountName: string;
    userPrincipalName: string;
    displayName: string;
    givenName: string | null;
    surname: string | null;
    mail: string | null;
    department: string | null;
    title: string | null;
    employeeNumber: string | null;
    distinguishedName: string;
    enabled: boolean;
    lastLogon: string | null;
    whenCreated: string;
    memberOf: string[];
};

export type ProvisionedAdUser = {
    user: AdUser;
    initialPassword: string;
    mustChangePasswordAtNextLogon: boolean;
};

export type ProvisionResponse = {
    dryRun: boolean;
    spec: NewAdUserSpec;
    provisioned: ProvisionedAdUser | null;
    stagedUser: StagedUser;
    emailSent: boolean;
    emailError: string | null;
};

export type NewAdGroupSpec = {
    samAccountName: string;
    name: string;
    displayName: string;
    mail: string | null;
    description: string | null;
};

export type AdGroup = {
    samAccountName: string;
    displayName: string;
    mail: string | null;
    description: string | null;
    distinguishedName: string;
    whenCreated: string;
};

export type ProvisionedAdGroup = {
    group: AdGroup;
};

export type MemberStatus = "AlreadyProvisioned" | "Provisioned" | "AdoptedExisting" | "Failed" | "Skipped";

export type MemberOutcome = {
    mail: string;
    displayName: string;
    parentOu: string;
    status: MemberStatus;
    adDn: string | null;
    error: string | null;
    emailSent: boolean;
};

export type GroupProvisionResponse = {
    dryRun: boolean;
    spec: NewAdGroupSpec;
    provisionedGroup: ProvisionedAdGroup | null;
    members: MemberOutcome[];
    stagedUser: StagedUser;
};

/** Same endpoint, different shape based on staged_user.kind. */
export type AnyProvisionResponse = ProvisionResponse | GroupProvisionResponse;

export const isGroupProvisionResponse = (r: AnyProvisionResponse): r is GroupProvisionResponse =>
    "members" in r;

// === Settings ===

/** SMTP settings as returned by GET /api/settings/smtp (password redacted). */
export type SmtpSettingsView = {
    smtpServer: string;
    port: number;
    userName: string;
    hasPassword: boolean;
    enableSsl: boolean;
    isEnabled: boolean;
    senderName: string;
    senderEmail: string;
};

/** Update payload for PUT /api/settings/smtp. Password empty = preserve existing. */
export type SmtpSettingsUpdate = {
    smtpServer: string;
    port: number;
    userName: string;
    password: string | null;
    enableSsl: boolean;
    isEnabled: boolean;
    senderName: string;
    senderEmail: string;
};

// === Reconcile (Phase C) ===

/** Group-provisioned user that reconcile would auto-disable. */
export type DisableCandidate = {
    mail: string;
    adSam: string;
    adDn: string;
    parentOu: string;
    provisionedVia: string;
    reason: string; // C1: always "lifecycle:left"
};

/** Per-row outcome from a real reconcile run. */
export type DisableOutcome = {
    mail: string;
    adSam: string;
    adDn: string | null;
    reason: string;
    succeeded: boolean;
    error: string | null;
};

/** Phase C2 placeholders — wire format is locked now, UI ignores in C1. */
export type TransferAlert = {
    mail: string;
    adSam: string;
    adDn: string;
    fromParentOu: string;
    toParentOu: string;
    currentGroup: string;
};

export type DriftAlert = {
    mail: string;
    adSam: string;
    expectedDn: string;
    driftKind: string;
};

export type GroupVanishAlert = {
    mail: string;
    adSam: string;
    adDn: string;
};

export type ReconcileReport = {
    dryRun: boolean;
    startedAt: string;
    completedAt: string;
    toDisable: DisableCandidate[];
    disableOutcomes: DisableOutcome[];
    transfers: TransferAlert[];
    drifts: DriftAlert[];
    groupVanishes: GroupVanishAlert[];
};

/** Audit-mail recipients for lifecycle reconcile (Phase C2). */
export type ReconcileAdminsView = {
    emails: string[];
    notifyOnEmpty: boolean;
};

/** Global initial-password policy as returned by GET /api/settings/password-policy. */
export type PasswordPolicyMode = "random" | "fixed";

export type PasswordPolicyView = {
    mode: PasswordPolicyMode;
    hasFixedPassword: boolean;
};

/** Update shape for PUT — blank fixedPassword keeps the existing one. */
export type PasswordPolicyUpdate = {
    mode: PasswordPolicyMode;
    fixedPassword: string | null;
};

/** Request body for POST /api/staged-users/{mail}/reset-password. */
export type ResetPasswordRequest = {
    mode: "auto" | "manual";
    password: string | null;
    mustChangeAtNextLogon: boolean;
};

/** Response — the new password is returned exactly once for hand-off. */
export type ResetPasswordResponse = {
    mail: string;
    newPassword: string;
    mustChangeAtNextLogon: boolean;
    auto: boolean;
};

// ---------------------------------------------------------------------------
// Manual atlas-sync trigger — POST /api/sync/trigger + history.
// Mirrors Atlas.Ad.Domain.SyncRun + SyncEndpoints response records.

export type SyncRunStatus = "running" | "success" | "failed";

/** One row from atlas.sync_runs — written by atlas-sync (Python). */
export type SyncRun = {
    runId: number;
    source: string;
    startedAt: string;
    finishedAt: string | null;
    entriesSeen: number | null;
    entriesUpserted: number | null;
    entriesDisappeared: number | null;
    status: SyncRunStatus;
    error: string | null;
};

/** Result of POST /api/sync/trigger — captured docker compose run output. */
export type SyncTriggerResponse = {
    success: boolean;
    exitCode: number;
    durationMs: number;
    stdoutTail: string;
    stderrTail: string;
    error: string | null;
};

/** GET /api/sync/status — enabled flag + in-flight flag + latest history row. */
export type SyncStatusResponse = {
    enabled: boolean;
    isRunning: boolean;
    latest: SyncRun | null;
};

/**
 * GET /api/sync/health — the verdict the daily sync monitor acts on
 * (architecture §4.1.4): consecutive-failure streak vs. threshold plus a
 * staleness guard. Read-only; mirrors Atlas.Ad.Domain.SyncHealthReport.
 */
export type SyncHealthReport = {
    evaluatedAt: string;
    inspectedRunCount: number;
    consecutiveFailures: number;
    failureThreshold: number;
    failureThresholdExceeded: boolean;
    lastSuccessAt: string | null;
    hoursSinceLastSuccess: number | null;
    stalenessHours: number;
    isStale: boolean;
    shouldAlert: boolean;
    latestRun: SyncRun | null;
    latestFailedRun: SyncRun | null;
    inspectedRuns: SyncRun[];
};

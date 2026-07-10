import type {
  AdminSession,
  Client,
  ClientAsset,
  ClientAssetInput,
  ClientInput,
  ClientNotifyEvent,
  HostingServer,
  HostingServerInput,
  InfrastructureOverview,
  LineItemInput,
  PaymentInput,
  ReminderRuleInput,
  ReminderSettings,
  SessionUser,
  TrackResult,
  WorkPackage,
  WorkPackageInput,
  WorkPackageStatus,
} from "./types";

/**
 * The frontend's view of the backend. Both the live HTTP client and the in-memory
 * mock implement this interface, so screens never depend on which one is active.
 * Methods grow per phase; Phase 0 covers auth + the read surfaces the shell needs.
 */
export interface BedrockApi {
  auth: {
    login(email: string, password: string): Promise<AdminSession>;
    /** Resolve the current admin from a session token (validates it). */
    me(token: string): Promise<SessionUser>;
    logout(): Promise<void>;
  };
  clients: {
    list(): Promise<Client[]>;
    get(id: string): Promise<Client>;
    create(input: ClientInput): Promise<Client>;
    update(id: string, input: ClientInput): Promise<Client>;
    remove(id: string): Promise<void>;
  };
  packages: {
    list(params?: { clientId?: string }): Promise<WorkPackage[]>;
    get(id: string): Promise<WorkPackage>;
    /** Public portal read by unguessable UUID slug. */
    getBySlug(slug: string): Promise<WorkPackage>;
    create(clientId: string, input: WorkPackageInput): Promise<WorkPackage>;
    update(id: string, input: WorkPackageInput): Promise<WorkPackage>;
    remove(id: string): Promise<void>;
    addLineItem(packageId: string, input: LineItemInput): Promise<WorkPackage>;
    updateLineItem(packageId: string, itemId: string, input: LineItemInput): Promise<WorkPackage>;
    removeLineItem(packageId: string, itemId: string): Promise<WorkPackage>;
    /** Apply a lifecycle transition (validated against allowed moves). */
    setStatus(id: string, status: WorkPackageStatus): Promise<WorkPackage>;
    /** Send the invoice + tracking link (WhatsApp + email) and move draft → sent. */
    send(id: string): Promise<WorkPackage>;
    /** On-demand account statement / payment reminder for long-running accounts. */
    notify(id: string, event: ClientNotifyEvent): Promise<WorkPackage>;
    /** Toggle a line item's done flag to drive the client progress bar. */
    setLineItemDone(packageId: string, itemId: string, done: boolean): Promise<WorkPackage>;
    /** Upload an original; the backend stores it in R2 and queues preview generation. */
    addDeliverable(packageId: string, file: File): Promise<WorkPackage>;
    removeDeliverable(packageId: string, deliverableId: string): Promise<WorkPackage>;
    /** Delete all original files from storage (keep previews) to free space after handoff. */
    purgeDeliverables(packageId: string): Promise<WorkPackage>;
    /**
     * Record a confirmed payment and run the two-gate logic. In production this is
     * driven by the verified Paystack webhook; admin entry covers offline payments.
     */
    recordPayment(packageId: string, input: PaymentInput): Promise<WorkPackage>;
  };
  infrastructure: {
    /** Hosting servers we monitor; optionally scoped to one client (null = Sahara's own). */
    listServers(clientId?: string): Promise<HostingServer[]>;
    createServer(input: HostingServerInput): Promise<HostingServer>;
    updateServer(id: string, input: HostingServerInput): Promise<HostingServer>;
    removeServer(id: string): Promise<void>;
    /** A client's monitored assets (domains, SSL, hosting, sites). */
    listAssets(clientId: string): Promise<ClientAsset[]>;
    createAsset(clientId: string, input: ClientAssetInput): Promise<ClientAsset>;
    updateAsset(id: string, input: ClientAssetInput): Promise<ClientAsset>;
    removeAsset(id: string): Promise<void>;
    /** Cross-client attention overview for the dashboard. */
    overview(): Promise<InfrastructureOverview>;
  };
  settings: {
    /** The reminder calendar + the list of events that may be scheduled. */
    getReminders(): Promise<ReminderSettings>;
    /** Replace the whole reminder rule set. */
    saveReminders(rules: ReminderRuleInput[]): Promise<ReminderSettings>;
    /** TEST-PHASE: delete all test data (keeps the admin account). */
    wipeTestData(): Promise<{ message: string }>;
  };
  track: {
    /** Issue a one-time code to the phone (if it's on file). Always resolves generically. */
    request(phone: string): Promise<{ message: string }>;
    /** Verify the code → a scoped token + that client's packages. */
    verify(phone: string, code: string): Promise<TrackResult>;
  };
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

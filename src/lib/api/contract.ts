import type {
  AdminSession,
  Client,
  ClientActivity,
  ClientAsset,
  ClientAssetInput,
  ClientInput,
  ClientNotifyEvent,
  HostingServer,
  HostingServerInput,
  InfraCharge,
  InfraChargeInput,
  InfraChargesOutstanding,
  InfrastructureOverview,
  Invoice,
  InvoiceInput,
  InvoicePaymentInput,
  InvoicesOutstanding,
  LineItemInput,
  PublicInvoice,
  MilestoneInput,
  PaymentInput,
  PaymentSession,
  ReminderRuleInput,
  ReminderSettings,
  ServerMetrics,
  SessionUser,
  TestServerInput,
  TestServerResult,
  TrackResult,
  VaultEntryInput,
  VaultEntryRecord,
  VaultKeyInput,
  VaultKeyRecord,
  VaultState,
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
    /** History feed: messages sent (with delivery/read status) + documents shared. */
    activity(id: string): Promise<ClientActivity>;
  };
  packages: {
    list(params?: { clientId?: string }): Promise<WorkPackage[]>;
    get(id: string): Promise<WorkPackage>;
    /** Public portal read by unguessable UUID slug. */
    getBySlug(slug: string): Promise<WorkPackage>;
    /**
     * Public portal: open a Paystack checkout for the outstanding balance, or for one
     * milestone when `milestoneId` is given. Records nothing as paid — the money only
     * counts once the verified webhook reaches the API.
     */
    startPayment(slug: string, milestoneId?: string | null): Promise<PaymentSession>;
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
    /** Add a milestone (a step in the package's payment schedule). */
    addMilestone(packageId: string, input: MilestoneInput): Promise<WorkPackage>;
    updateMilestone(packageId: string, milestoneId: string, input: MilestoneInput): Promise<WorkPackage>;
    removeMilestone(packageId: string, milestoneId: string): Promise<WorkPackage>;
    /** Record a payment that settles a milestone, mark it paid, then run the gates. */
    payMilestone(packageId: string, milestoneId: string, method: string | null): Promise<WorkPackage>;
  };
  infrastructure: {
    /** Hosting servers we monitor; optionally scoped to one client (null = Sahara's own). */
    listServers(clientId?: string): Promise<HostingServer[]>;
    createServer(input: HostingServerInput): Promise<HostingServer>;
    updateServer(id: string, input: HostingServerInput): Promise<HostingServer>;
    removeServer(id: string): Promise<void>;
    /** Dry-run a cPanel/SSH credential set (no save) — returns live metrics or a precise error. */
    testServer(input: TestServerInput): Promise<TestServerResult>;
    /** Rich live detail for a hosting server's dashboard (disk/storage/bandwidth/email/counts). */
    serverMetrics(id: string): Promise<ServerMetrics>;
    /** A client's monitored assets (domains, SSL, hosting, sites). */
    listAssets(clientId: string): Promise<ClientAsset[]>;
    createAsset(clientId: string, input: ClientAssetInput): Promise<ClientAsset>;
    updateAsset(id: string, input: ClientAssetInput): Promise<ClientAsset>;
    removeAsset(id: string): Promise<void>;
    /** Cross-client attention overview for the dashboard. */
    overview(): Promise<InfrastructureOverview>;
    /** Re-check one asset live (RDAP/TLS/HTTP/cPanel) and return its fresh state. */
    syncAsset(id: string): Promise<ClientAsset>;
    /** Re-check every monitored asset and return the refreshed overview. */
    syncAll(): Promise<InfrastructureOverview>;
    /** A client's infrastructure charges (hosting/domain/other fees). */
    listCharges(clientId: string): Promise<InfraCharge[]>;
    createCharge(clientId: string, input: InfraChargeInput): Promise<InfraCharge>;
    updateCharge(id: string, input: InfraChargeInput): Promise<InfraCharge>;
    removeCharge(id: string): Promise<void>;
    /** Mark an infrastructure charge settled. */
    payCharge(id: string): Promise<InfraCharge>;
    /** Cross-client outstanding infrastructure charges (total + items) for the dashboard. */
    chargesOutstanding(): Promise<InfraChargesOutstanding>;
  };
  /**
   * Standalone invoices — billing raised directly against a client, outside the work-package
   * flow. A draft is editable; `issue` mints the verifiable Document ID printed on the PDF and
   * freezes the lines. See docs/DOCUMENT-CODES.md.
   */
  invoices: {
    /** Every invoice, newest first; optionally narrowed to one client. */
    list(clientId?: string): Promise<Invoice[]>;
    get(id: string): Promise<Invoice>;
    create(clientId: string, input: InvoiceInput): Promise<Invoice>;
    /** Drafts only — an issued invoice is a document the client is already holding. */
    update(id: string, input: InvoiceInput): Promise<Invoice>;
    remove(id: string): Promise<void>;
    /** Mint the verification identity and move the invoice to `issued`. */
    issue(id: string): Promise<Invoice>;
    /** Record a payment taken outside the gateway; a cleared balance settles and mints a receipt. */
    recordPayment(id: string, input: InvoicePaymentInput): Promise<Invoice>;
    void(id: string): Promise<Invoice>;
    /** Issued invoices still owed, for the Receivables dashboard. */
    outstanding(): Promise<InvoicesOutstanding>;
    /** PUBLIC (unguessable slug): the client-facing read behind the Pay button. */
    getBySlug(slug: string): Promise<PublicInvoice>;
    /**
     * PUBLIC: open a gateway checkout for the outstanding balance. Confirms nothing — only the
     * verified webhook turns this into money received.
     */
    startPayment(slug: string): Promise<PaymentSession>;
  };
  settings: {
    /** The reminder calendar + the list of events that may be scheduled. */
    getReminders(): Promise<ReminderSettings>;
    /** Replace the whole reminder rule set. */
    saveReminders(rules: ReminderRuleInput[]): Promise<ReminderSettings>;
    /** TEST-PHASE: delete all test data (keeps the admin account). */
    wipeTestData(): Promise<{ message: string }>;
  };
  /**
   * The operator's credential vault. Every method moves ciphertext the browser produced and
   * only the browser can open, so this layer never sees a password. Scoped server-side to the
   * authenticated user. See docs/VAULT.md.
   */
  vault: {
    /** The wrapped key (null before setup) and every encrypted entry. */
    get(): Promise<VaultState>;
    /** First-time setup. Rejected if a key already exists, which would orphan every entry. */
    createKey(input: VaultKeyInput): Promise<VaultKeyRecord>;
    /** Passphrase change: the same data key rewrapped. Entries are not re-encrypted. */
    updateKey(input: VaultKeyInput): Promise<VaultKeyRecord>;
    createEntry(input: VaultEntryInput): Promise<VaultEntryRecord>;
    updateEntry(id: string, input: VaultEntryInput): Promise<VaultEntryRecord>;
    removeEntry(id: string): Promise<void>;
    /** Destroy the key and every entry. The only exit from a forgotten passphrase. */
    destroy(password: string): Promise<void>;
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

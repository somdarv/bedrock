import type {
  AdminSession,
  Client,
  ClientInput,
  LineItemInput,
  SessionUser,
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
    /** Send the invoice + tracking link (Termii/email) and move draft → sent. */
    send(id: string): Promise<WorkPackage>;
    /** Toggle a line item's done flag to drive the client progress bar. */
    setLineItemDone(packageId: string, itemId: string, done: boolean): Promise<WorkPackage>;
    /** Upload an original; the backend stores it in R2 and queues preview generation. */
    addDeliverable(packageId: string, file: File): Promise<WorkPackage>;
    removeDeliverable(packageId: string, deliverableId: string): Promise<WorkPackage>;
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

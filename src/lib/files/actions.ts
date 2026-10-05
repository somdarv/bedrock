"use server";

import { api, ApiError, type FileSelection, type FileShareInput, type WorkPackage } from "@/lib/api";
import { revalidateFiles } from "./server";

/**
 * File repository edits. Each answers with the whole package, so the browser swaps its copy in
 * one step instead of waiting for the page to refetch.
 */
export type FilesResult = { ok: true; pkg: WorkPackage } | { ok: false; error: string };

async function run(
  packageId: string,
  fallback: string,
  call: () => Promise<WorkPackage>,
): Promise<FilesResult> {
  try {
    const pkg = await call();
    revalidateFiles(packageId);
    return { ok: true, pkg };
  } catch (e) {
    return { ok: false, error: e instanceof ApiError && e.message ? e.message : fallback };
  }
}

export async function createFolder(packageId: string, name: string, parentId: string | null) {
  return run(packageId, "Could not create the folder.", () =>
    api.packages.createFolder(packageId, { name, parentId }),
  );
}

export async function renameFolder(packageId: string, folderId: string, name: string) {
  return run(packageId, "Could not rename the folder.", () =>
    api.packages.updateFolder(packageId, folderId, { name }),
  );
}

export async function renameFile(packageId: string, fileId: string, filename: string) {
  return run(packageId, "Could not rename the file.", () =>
    api.packages.updateFile(packageId, fileId, { filename }),
  );
}

/**
 * File this file under a plan item, or `null` to unfile it. That is the join between the two
 * halves: the client sees the files under the thing they approved (docs/PLAN.md).
 */
export async function fileUnderPlanItem(
  packageId: string,
  fileId: string,
  planItemId: string | null,
) {
  return run(packageId, "Could not file that.", () =>
    api.packages.updateFile(packageId, fileId, { planItemId }),
  );
}

export async function moveItems(packageId: string, selection: FileSelection, to: string | null) {
  return run(packageId, "Could not move those items.", () =>
    api.packages.moveFiles(packageId, selection, to),
  );
}

export async function deleteItems(packageId: string, selection: FileSelection) {
  return run(packageId, "Could not delete those items.", () =>
    api.packages.deleteFiles(packageId, selection),
  );
}

export async function freeUpStorage(packageId: string) {
  return run(packageId, "Could not free up storage.", () =>
    api.packages.purgeDeliverables(packageId),
  );
}

/* ------------------------------------------------------------ share links */

/**
 * Turn on the link to a file, a folder, or the whole project (both null). Sharing something that
 * already has a link changes that link instead. The answer's `shareId` names it.
 */
export async function shareItem(
  packageId: string,
  target: { fileId: string | null; folderId: string | null },
  input: FileShareInput = {},
) {
  return run(packageId, "Could not make the link.", () => api.shares.create(packageId, target, input));
}

export async function updateShare(packageId: string, shareId: string, input: FileShareInput) {
  return run(packageId, "Could not change the link.", () => api.shares.update(packageId, shareId, input));
}

/** The link stops working for everyone who has it. Sharing again makes a new one. */
export async function stopSharing(packageId: string, shareId: string) {
  return run(packageId, "Could not turn the link off.", () => api.shares.remove(packageId, shareId));
}

/** Returns a Prisma `where` clause fragment that excludes soft-deleted records. */
export function notDeleted() {
  return { deletedAt: null };
}

/** Soft-delete a record by setting deletedAt to now. */
export function softDeleteData() {
  return { deletedAt: new Date() };
}

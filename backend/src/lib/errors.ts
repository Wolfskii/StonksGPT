/**
 * Turn any thrown value into a string suitable for API responses.
 * Unwraps AggregateError so the real cause (e.g. DB connection refused) is visible.
 */
export function toErrorMessage(e: unknown): string {
  if (e instanceof AggregateError && e.errors?.length) {
    const parts = e.errors.map((err) => String(err));
    return `${e.message}: ${parts.join("; ")}`;
  }
  if (e instanceof Error) return e.message;
  return String(e);
}

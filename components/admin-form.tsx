"use client";
import { useActionState } from "react";
export type ActionResult = { error?: string; success?: string };
export function AdminForm({
  action,
  children,
  label = "SAVE CHANGES",
  className = "",
}: {
  action: (previous: ActionResult, form: FormData) => Promise<ActionResult>;
  children: React.ReactNode;
  label?: string;
  className?: string;
}) {
  const [result, run, busy] = useActionState(action, {});
  return (
    <form action={run} className={className}>
      {children}
      {result.error && (
        <p className="form-message error" role="alert">
          {result.error}
        </p>
      )}
      {result.success && (
        <p className="form-message success" role="status">
          {result.success}
        </p>
      )}
      <button className="button" style={{ marginTop: 22 }} disabled={busy}>
        {busy ? "WORKING…" : label}
      </button>
    </form>
  );
}

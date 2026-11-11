"use client";
import { useActionState } from "react";
import { signIn } from "./actions";
import { PageIntro, Field } from "@/components/ui";
export default function Login() {
  const [error, action, busy] = useActionState(signIn, undefined);
  return (
    <>
      <PageIntro index="↗" kicker="STAFF ACCESS" title="BEHIND THE SCENES.">
        <p>Sign in with your authorized staff account.</p>
      </PageIntro>
      <div className="page-content">
        <form action={action} className="form-shell" style={{ maxWidth: 450 }}>
          <div className="form-grid" style={{ gridTemplateColumns: "1fr" }}>
            <Field label="Staff email">
              <input
                name="email"
                type="email"
                autoComplete="username"
                required
              />
            </Field>
            <Field label="Password">
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                minLength={8}
                required
              />
            </Field>
          </div>
          {error && (
            <p className="form-message error" role="alert">
              {error}
            </p>
          )}
          <button className="button" style={{ marginTop: 25 }} disabled={busy}>
            {busy ? "SIGNING IN…" : "SIGN IN ↗"}
          </button>
          <p className="small-note">
            Access is by invitation. There is no public staff registration.
          </p>
        </form>
      </div>
    </>
  );
}

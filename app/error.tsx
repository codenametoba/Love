"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="page-content">
      <h1 style={{ fontSize: 42, margin: "40px 0 20px" }}>
        A brief intermission.
      </h1>
      <p>We couldn’t load this page. Please try again.</p>
      <button className="button" style={{ marginTop: 30 }} onClick={reset}>
        TRY AGAIN ↗
      </button>
    </div>
  );
}

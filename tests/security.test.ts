import { describe, it, expect, vi } from "vitest";
import { hash, sameOrigin, validCron, jsonBody } from "../lib/security";
import { escapeHtml, notificationEmail } from "../lib/email";
describe("request security", () => {
  it("hashes customer bearer links deterministically without retaining plaintext", () => {
    expect(hash("secret")).toHaveLength(64);
    expect(hash("secret")).not.toContain("secret");
    expect(hash("secret")).not.toBe(hash("other"));
  });
  it("rejects cross-origin writes", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://love.example");
    expect(() =>
      sameOrigin(
        new Request("https://love.example/api/reservations", {
          method: "POST",
          headers: {
            origin: "https://evil.example",
            "content-type": "application/json",
          },
        }),
      ),
    ).toThrow();
    vi.unstubAllEnvs();
  });
  it("rejects missing origin", () =>
    expect(() =>
      sameOrigin(
        new Request("http://localhost:3000/api/reservations", {
          method: "POST",
          headers: { "content-type": "application/json" },
        }),
      ),
    ).toThrow());
  it("rejects unconfigured and wrong cron credentials", () => {
    vi.stubEnv("CRON_SECRET", "");
    expect(validCron(new Request("http://localhost"))).toBe(false);
    vi.stubEnv("CRON_SECRET", "long-test-secret");
    expect(
      validCron(
        new Request("http://localhost", {
          headers: { authorization: "Bearer wrong" },
        }),
      ),
    ).toBe(false);
    expect(
      validCron(
        new Request("http://localhost", {
          headers: { authorization: "Bearer long-test-secret" },
        }),
      ),
    ).toBe(true);
    vi.unstubAllEnvs();
  });
  it("limits the actual body size, not just content-length", async () => {
    await expect(
      jsonBody(
        new Request("http://localhost", {
          method: "POST",
          body: "x".repeat(16001),
        }),
      ),
    ).rejects.toThrow("too large");
  });
});
describe("transactional email", () => {
  it("escapes user-provided HTML", () => {
    expect(escapeHtml('<img src=x onerror="x">')).toBe(
      "&lt;img src=x onerror=&quot;x&quot;&gt;",
    );
    expect(
      notificationEmail("request", {
        name: "<script>bad</script>",
        reference: "TEST",
      }).html,
    ).not.toContain("<script>");
  });
  it("never describes a pending request as confirmed", () => {
    const e = notificationEmail("request", { reference: "TEST" });
    expect(e.text).toContain("not a confirmed reservation");
    expect(e.subject).toContain("Your request is in");
  });
  it("includes the actual section terms in the approval email", () => {
    const e = notificationEmail("approved", {
      deposit: 10000,
      minimum: 50000,
      policy: "Test policy from management",
      expires: "2027-01-01T21:00:00Z",
      url: "https://love.example/reservation/token",
    });
    expect(e.text).toContain("$100");
    expect(e.text).toContain("$500");
    expect(e.text).toContain("Test policy from management");
    expect(e.html).toContain("https://love.example/reservation/token");
  });
});

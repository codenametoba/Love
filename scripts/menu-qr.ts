import QRCode from "qrcode";
import { mkdir, writeFile } from "node:fs/promises";
const raw = process.env.NEXT_PUBLIC_SITE_URL;
if (
  !raw ||
  !raw.startsWith("https://") ||
  /localhost|vercel\.app|\.test|example\./.test(raw)
)
  throw new Error(
    "Set NEXT_PUBLIC_SITE_URL to the verified permanent HTTPS production domain before generating print assets.",
  );
const target = new URL("/menu", raw).href;
await mkdir("deliverables", { recursive: true });
await writeFile(
  "deliverables/love-menu-qr.svg",
  await QRCode.toString(target, {
    type: "svg",
    errorCorrectionLevel: "H",
    margin: 4,
    width: 1200,
  }),
);
await QRCode.toFile("deliverables/love-menu-qr.png", target, {
  errorCorrectionLevel: "H",
  margin: 4,
  width: 2400,
});
console.log(
  `Created SVG and 2400px PNG for ${target}. Print-proof and scan both before use.`,
);

/**
 * Launch smoke: public assets + critical routes respond.
 * Usage: npx tsx scripts/check-launch.ts [baseUrl]
 */
const base = process.argv[2] ?? "https://proof-smoky.vercel.app";

const paths = [
  "/",
  "/gate",
  "/privacy",
  "/terms",
  "/robots.txt",
  "/sitemap.xml",
  "/og.png",
  "/favicon.ico",
  "/api/v1/evaluate",
];

async function main() {
  let failed = 0;
  for (const path of paths) {
    const url = `${base}${path}`;
    try {
      const res = await fetch(url, { redirect: "follow" });
      const ok = res.status >= 200 && res.status < 400;
      console.log(ok ? "ok" : "FAIL", res.status, path);
      if (!ok) failed += 1;
    } catch (err) {
      console.log("FAIL", path, err instanceof Error ? err.message : err);
      failed += 1;
    }
  }
  if (failed) {
    console.error(`check_launch_failed ${failed}`);
    process.exit(1);
  }
  console.log("check_launch_ok", base);
}

main();

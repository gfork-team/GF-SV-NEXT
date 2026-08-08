// scan config refs
const { readFileSync, readdirSync, statSync } = require("fs");
const path = require("path");

function walk(d) {
  const r = [];
  for (const f of readdirSync(d)) {
    const p = path.join(d, f);
    try {
      if (statSync(p).isDirectory() && f !== "node_modules" && !f.startsWith(".")) r.push(...walk(p));
      else if (f.endsWith(".svelte") || f.endsWith(".ts")) r.push(p);
    } catch {}
  }
  return r;
}

const cf = readFileSync("src/lib/config.ts", "utf8");
const km = cf.match(/export const siteConfig = \{[\s\S]*?\} as const;/);
const ck = new Set();
if (km) {
  const re = /\n\s+(\w+):\s/gm;
  let m;
  while ((m = re.exec(km[0]))) ck.add(m[1]);
}

console.log("Config keys:", [...ck].sort().join(", "));

const fs = walk("src");
for (const f of fs) {
  let c;
  try { c = readFileSync(f, "utf8"); } catch {}
  if (!c) continue;
  const re = /siteConfig\.(\w+)/g;
  let m;
  while ((m = re.exec(c))) {
    const tag = ck.has(m[1]) ? "OK  " : "MISS";
    console.log(tag + " " + f.replace(/^src[\/\\]/, "") + " siteConfig." + m[1]);
  }
}

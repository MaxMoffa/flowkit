#!/usr/bin/env node
// Publishes each workspace package to npm only if its local version
// isn't already on the registry (avoids "cannot publish over existing version" failures
// when master is pushed without a version bump).
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const packages = ["core", "themes", "adapters", "presets", "react", "create-flowkit"];

for (const dir of packages) {
  const pkgPath = `packages/${dir}/package.json`;
  const { name, version } = JSON.parse(readFileSync(pkgPath, "utf8"));

  let published = [];
  try {
    const raw = execFileSync("npm", ["view", name, "versions", "--json"], {
      encoding: "utf8",
    });
    published = JSON.parse(raw);
  } catch {
    // Package not found on registry yet: first publish.
    published = [];
  }

  if (published.includes(version)) {
    console.log(`skip ${name}@${version} (already published)`);
    continue;
  }

  console.log(`publishing ${name}@${version}...`);
  execFileSync("npm", ["publish", "-w", `packages/${dir}`], { stdio: "inherit" });
}

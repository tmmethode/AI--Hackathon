#!/usr/bin/env node

const { spawnSync } = require("node:child_process");

const args = process.argv.slice(2);
const command = args[0];

const nodeEnvByCommand = {
  build: "production",
  dev: "development",
  start: "production",
};

const normalizedNodeEnv = nodeEnvByCommand[command];

if (normalizedNodeEnv) {
  process.env.NODE_ENV = normalizedNodeEnv;
}

const nextBin = require.resolve("next/dist/bin/next");
const result = spawnSync(process.execPath, [nextBin, ...args], {
  env: process.env,
  stdio: "inherit",
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);

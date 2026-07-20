import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(testDir, "..");
const walletSessionPath = path.join(frontendRoot, "hooks/use-wallet-session.ts");
const langclawApiCorePath = path.join(
  frontendRoot,
  "lib/langclaw-api/core.ts",
);
const miniPayPath = path.join(frontendRoot, "lib/minipay.ts");
const web3ProviderPath = path.join(frontendRoot, "lib/Web3Provider.tsx");
const envExamplePath = path.join(frontendRoot, ".env.example");
const appSidebarPath = path.join(frontendRoot, "components/app-sidebar.tsx");

test("MiniPay session auth does not fall back to wallet message signing", () => {
  const source = readFileSync(walletSessionPath, "utf8");
  const miniPayGuardIndex = source.indexOf("MINIPAY_SESSION_REQUIRED_MESSAGE");
  const challengeIndex = source.indexOf("requestWalletChallenge({");

  assert.ok(
    miniPayGuardIndex > -1,
    "Expected use-wallet-session.ts to define a MiniPay session-required guard.",
  );
  assert.ok(
    miniPayGuardIndex < challengeIndex,
    "Expected MiniPay session guard before the wallet challenge/signature flow.",
  );
  assert.match(
    source,
    /if\s*\(\s*isMiniPayProvider\(\)\s*\)\s*{[\s\S]*throw new Error\(MINIPAY_SESSION_REQUIRED_MESSAGE\)/,
    "Expected MiniPay to throw a session-required error instead of signing.",
  );
});

test("RainbowKit WalletConnect project id is environment configured", () => {
  const source = readFileSync(web3ProviderPath, "utf8");

  assert.ok(
    source.includes("NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID"),
    "Expected Web3Provider to read NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID.",
  );
  assert.ok(
    !source.includes('"YOUR_PROJECT_ID"'),
    "Expected Web3Provider not to hardcode the RainbowKit placeholder project id.",
  );
});

test("MiniPay session errors point users to credit verification", () => {
  const source = readFileSync(langclawApiCorePath, "utf8");

  assert.match(
    source,
    /minipay session required/i,
    "Expected readFriendlyError to recognize MiniPay session-required failures.",
  );
  assert.match(
    source,
    /credits page/i,
    "Expected the MiniPay session message to send users to the Credits page.",
  );
});

test("MiniPay signature-only actions explain the browser-wallet fallback", () => {
  const source = readFileSync(walletSessionPath, "utf8");
  const apiSource = readFileSync(langclawApiCorePath, "utf8");

  assert.ok(
    source.includes("MINIPAY_SIGNATURE_UNAVAILABLE_MESSAGE"),
    "Expected MiniPay signature-only actions to use a dedicated error message.",
  );
  assert.match(
    apiSource,
    /browser wallet outside MiniPay/i,
    "Expected signature-only MiniPay errors to explain the browser-wallet fallback.",
  );
});

test("frontend env example documents WalletConnect project id", () => {
  const source = readFileSync(envExamplePath, "utf8");

  assert.ok(
    source.includes("NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="),
    "Expected .env.example to document NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID.",
  );
});

test("frontend README documents MiniPay mobile release checks", () => {
  const source = readFileSync(path.join(frontendRoot, "README.md"), "utf8");

  for (const claim of [
    "Open the deployed Mini App inside MiniPay.",
    "Celo mainnet `42220`",
    "manual desktop Connect Wallet button is hidden",
    "live\n   `LangclawUsageVault`",
    "Proof Center\n   proof metadata",
  ]) {
    assert.ok(source.includes(claim), `Expected MiniPay QA doc to include ${claim}`);
  }
});

test("MiniPay sidebar hides the manual Connect Wallet button", () => {
  const source = readFileSync(appSidebarPath, "utf8");
  const miniPayBranchIndex = source.indexOf(": isMiniPay ? (");
  const connectButtonIndex = source.indexOf("<ConnectButton.Custom>");

  assert.ok(
    source.includes("useIsMiniPay"),
    "Expected the sidebar to detect MiniPay before rendering wallet actions.",
  );
  assert.ok(
    miniPayBranchIndex > -1,
    "Expected a MiniPay-specific disconnected sidebar state.",
  );
  assert.ok(
    connectButtonIndex > miniPayBranchIndex,
    "Expected the manual Connect Wallet button to be outside the MiniPay branch.",
  );
});

test("MiniPay provider detection guards server and non-MiniPay environments", () => {
  const source = readFileSync(miniPayPath, "utf8");

  assert.match(source, /typeof window !== "undefined"/);
  assert.match(source, /window\.ethereum !== undefined/);
  assert.match(source, /window\.ethereum\.isMiniPay === true/);
  assert.match(
    source,
    /if \(!isMiniPayProvider\(\) \|\| !window\.ethereum\) {[\s\S]*?throw new Error\("Open this app inside MiniPay\."\)/,
  );
});

test("MiniPay connector is stable and keeps shim disconnect disabled", () => {
  const source = readFileSync(miniPayPath, "utf8");
  const walletSessionSource = readFileSync(walletSessionPath, "utf8");

  assert.equal(
    source.match(/injected\(\{ shimDisconnect: false \}\)/g)?.length,
    1,
  );
  assert.match(source, /const miniPayConnector = injected/);
  assert.match(
    source,
    /export function getMiniPayConnector\(\) {[\s\S]*?return miniPayConnector;/,
  );
  assert.match(
    walletSessionSource,
    /if \(isMiniPayProvider\(\)\) {[\s\S]*?connectors\.find[\s\S]*?getMiniPayConnector\(\)[\s\S]*?chainId: MINIPAY_CHAIN_ID/,
  );
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(testDir, "..");
const walletSessionPath = path.join(frontendRoot, "hooks/use-wallet-session.ts");
const langclawApiPath = path.join(frontendRoot, "lib/langclaw-api.ts");
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
  const source = readFileSync(langclawApiPath, "utf8");

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
  const apiSource = readFileSync(langclawApiPath, "utf8");

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

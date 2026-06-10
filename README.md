# Langclaw Frontend

Next.js interface for **Langclaw Celo Alpha Sentinel**, with MiniPay-aware wallet
auth, Celo Intelligence, USDT usage credits, Strategy Lab, Alpha Watchlist, and
Proof Center.

## User-Facing Areas

| Area | Purpose |
| --- | --- |
| Chat / Celo Intelligence | Celo smart-money, liquidity anomaly, protocol momentum, and holder-flow prompts |
| Alpha Watchlist | Saved Celo intelligence signals for follow-up review |
| Usage | Celo USDT credits, vault info, deposit verification, and withdrawal request flow |
| Strategy Lab | Celo pair scan, Dune-backed backtest, equity curve, trade table, and paper-trade proof |
| Proof Center | Celo `LangclawRegistry` decisions and `LangclawTradingJournal` strategy records |
| Settings / Automation | Telegram linking, notification settings, and scheduled monitor configuration |
| API Keys / Memory | Wallet-scoped API key management and memory controls |

The app is analysis-first. It does not execute live-funds trades.

## Local Setup

This folder is tracked inside the Langclaw Celo single-root workspace alongside
`backend`, `contracts`, and `.github`. Run git status, diff, and commits from
the workspace root when coordinating campaign changes across surfaces.

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

The frontend talks to the backend through `NEXT_PUBLIC_LANGCLAW_API_URL`.
Default frontend env:

```bash
NEXT_PUBLIC_LANGCLAW_API_URL=/api/backend
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
LANGCLAW_BACKEND_REWRITE_URL=http://127.0.0.1:3002
```

If the backend is running with its package default (`npm run dev`, port `3001`),
set:

```bash
LANGCLAW_BACKEND_REWRITE_URL=http://127.0.0.1:3001
```

On Vercel, `LANGCLAW_BACKEND_REWRITE_URL` must be a public Celo backend URL or a
domain that proxies to the VPS backend. Do not point a deployed HTTPS frontend
at a private localhost or plain HTTP-only backend.

## Model Contract

The frontend hard-locks chat requests to:

```text
gpt-5.4-nano
```

Source: [`lib/chat-model.ts`](lib/chat-model.ts).

The backend may still use `OPENAI_CHAT_MODEL` and `OPENAI_AGENT_MODEL` defaults
when no requested model is supplied. Frontend create/send/retry paths should use
`resolveChatModel()` rather than adding a second model selector.

## Demo Flow

Use Celo Intelligence mode with:

```text
Find smart-money accumulation on Celo
```

Then:

```text
Detect liquidity anomalies on Celo DEX pairs
```

Then:

```text
Rank Celo protocols by TVL and yield momentum
```

Expected output:

- Source-backed signal summary.
- Risk notes and false-positive checks.
- Provider evidence and source gaps.
- `report` rendering with cards or tables when data exists.
- `Agent decision proof` panel when backend proof anchoring is configured.

Click **Add to watchlist** on a Celo Intelligence result, then open
`/watchlist` to review saved signals. Open `/strategy` to run the Dune-backed
Celo Liquidity Momentum Strategy, review equity curve/trades, and open a paper
trade proof. Open `/proofs` to inspect latest registry decisions and Strategy
Proofs for the Celo agent.

## Wallet, MiniPay, And Chain Behavior

- Default product chain is Celo.
- MiniPay detection checks `window.ethereum.isMiniPay`.
- Inside MiniPay, the app stays on Celo mainnet `42220`.
- Celo billing currency is USDT with 6 decimals.
- Celo USDT token:

  ```text
  0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e
  ```

- Celo fee-currency adapter configured in frontend chain metadata:

  ```text
  0x0e2a3e05bc9a16f5292a6170456a710cb89c6f72
  ```

Research requests require a connected wallet and linked Telegram account. If the
wallet session is missing, the UI should ask the user to connect/sign. If
Telegram is missing, the Telegram connect dialog should handle the link flow.

MiniPay release checks should verify the mobile path instead of only a desktop
wallet path:

1. Open the deployed Mini App inside MiniPay.
2. Confirm the app resolves to Celo mainnet `42220`.
3. Confirm the manual desktop Connect Wallet button is hidden in the MiniPay
   sidebar state.
4. Open `/usage` and verify the Celo USDT credit path points at the live
   `LangclawUsageVault`.
5. Run a Celo Intelligence prompt and confirm the result can show Proof Center
   proof metadata when backend anchoring is configured.

## Usage Credits

Celo Intelligence requests reserve and settle the user's internal selected-chain
usage balance through the backend billing ledger. USDT-backed credits on Celo
are the default. MNT-backed credits on Mantle remain available as an optional
chain.

Usage flow:

1. User connects wallet.
2. Usage page loads balance, quote, and vault info.
3. User approves USDT allowance when needed.
4. User deposits USDT into `LangclawUsageVault`.
5. Frontend waits for receipt and submits deposit verification.
6. Backend credits the internal usage ledger.
7. Research requests reserve/settle internal balance.
8. Withdraw request returns backend authorization before user calls vault
   withdrawal.

## Live Proof Contracts

| Chain | `LangclawRegistry` | `LangclawTradingJournal` | `LangclawUsageVault` |
| --- | --- | --- | --- |
| Celo | `0xe69755e4249c4978c39fbe847ca9674ce7af3505` | `0x69984c20176704685236fd633192d7de1c13a5ec` | `0x837a2948586de4e7638c742f99e520ffc049bcf7` |
| Mantle | `0xe69755e4249c4978c39fbe847ca9674ce7af3505` | `0xe96e9b76af8c8f32bfa2235d647186826d92fb7d` | `0x7e93Ef361e7b54297cF963977bA829E47E59e8E1` |

Celo agent identity:

| Item | Value |
| --- | --- |
| ERC-8004 identity registry | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` |
| ERC-8004 agent ID | `9109` |
| ERC-8004 registration tx | `0x1b7cb74378db42551a3cbc81dcd560f337df1593d4ef1cd70ee44ff269bdc7f3` |
| Self Agent ID | `133` |
| Self Agent ID registration tx | `0x3c7d0cc69f77d2aef5ab21bfe703d0f33f7037d5e2162209d78b23b5c3f1cde6` |
| Agent owner / recorder | `0x2cA915EF6be8D2D48ccD3c5dAF715546AF873A4c` |

Latest ERC-8004 Celo decision proof:

```text
Decision #47
Signal: campaign-backend-proof
Agent: 9109
Tx: 0xb50e7bd12af0cbca9a6246a80f1976da753d359fbd1553458712b43aa40681b1
```

Latest ERC-8004 proof run:

```text
Run: github-backend-433b125-2026-06-08
Evidence: https://github.com/Langclaw-AI-Celo/backend/commit/433b12562c6472dae9e3ff5a1286596a0420eaeb
```

Latest Self-linked Celo decision proof:

```text
Decision #1
Signal: smart-money
Agent: 133
Tx: 0x2a2f94c40e2b5c080bd330f43f3ce6bc6b05e054b6626ce3ab2716220f0d3211
```

As of the 2026-06-10 backend proof-readiness recheck, the latest public Celo
decision is now decision `#47` for ERC-8004 agent `9109`. Local clones now
report `ready` when the preferred proof agent is the ERC-8004 campaign agent.
Self Agent ID `133` remains available for linked-proof and human-verification
flows without becoming the default campaign proof writer.

Strategy Lab journal proofs are configured against the live backend deployments.
Local clones without `{MANTLE,CELO}_LANGCLAW_TRADING_JOURNAL_ADDRESS` still run
backtests, but Proof Center should honestly show the journal as not configured.

The 2026-06-10 backend proof-readiness check now returns `ready` because the
default proof path prefers the ERC-8004 campaign agent `9109`. Self Agent ID
`133` remains documented for linked-proof and human-verification flows. RPC
connectivity, gas balance, and registry readability all passed.

## Important Routes

| Route | Surface |
| --- | --- |
| `/` | Home / launch surface |
| `/chat` | Chat and Celo Intelligence |
| `/usage` | Usage balance, deposits, withdrawals |
| `/watchlist` | Alpha Watchlist |
| `/strategy` | Strategy Lab |
| `/proofs` | Proof Center |
| `/settings` | Automation and notification settings |
| `/key` | API key management |
| `/memory` | Memory controls |
| `/task` | Automation task surface |

## Development Notes

- This project uses Next.js `16.2.6`, React `19.2.4`, Wagmi `3.6.14`, and
  RainbowKit `2.2.11`.
- Read [`AGENTS.md`](AGENTS.md) before changing Next.js code.
- Keep Celo-specific labels visible where they are source-of-truth: chain badge,
  usage billing, proof records, and MiniPay flows.
- Do not add a second frontend model selector unless the product contract is
  changed intentionally.
- Frontend should not fabricate sample provider data on live Celo surfaces. If
  backend returns gaps or provider failures, render them honestly.

## Verification

```bash
node --test tests/minipay-compliance.test.mjs
node --test tests/proof-layer-copy.test.mjs tests/home-launchpad-proof-copy.test.mjs
node --test tests/proof-layer-links.test.mjs tests/readme-proof-notes.test.mjs
node --test tests/readme-proof-state.test.mjs
node --test tests/readme-routes.test.mjs tests/chain-selector-labels.test.mjs
pnpm typecheck
pnpm build
```

Use the MiniPay compliance test as the quickest regression net for wallet
session, WalletConnect env, and sidebar-connect behavior before broader UI
checks.

Use the route and chain-selector tests after README or product-surface wording
changes so the public docs stay aligned with shipped pages and Celo labels.

Use the proof-layer copy, proof-layer link, and README proof-notes tests after
changing home hero, proof, or launchpad surfaces that reference live Celo agent
IDs, proof links, or the ERC-8004 versus Self-linked story.

Use the README proof-state test after refreshing public proof copy so the
documented warning semantics stay aligned with the backend readiness output.

For rendered UI changes, also run the app and check the affected pages in a
browser:

```bash
pnpm dev
```

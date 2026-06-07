# Celo Frontend Port Reference

This document records the Celo frontend porting approach and the current
post-port verification expectations. It is historical context for future agents,
not an instruction to overwrite the Celo frontend from the Mantle repo again.

## Goal

Mirror the latest shared Langclaw frontend UX patterns into the Celo frontend,
then keep only chain-specific values different:

- Celo chain ID `42220`.
- Celo / USDT wallet and usage labels.
- Celoscan explorer URLs.
- Celo proof contract addresses.
- Celo ERC-8004 agent ID `9109`.
- Celo Self Agent ID `133`.
- Latest Celo proof transaction references.
- MiniPay-specific Celo mainnet behavior.

## Current Celo-Specific Contract

| Area | Current value |
| --- | --- |
| Default product chain | `celo` |
| Chat model | `gpt-5.4-nano` through `lib/chat-model.ts` |
| Billing asset | Celo USDT |
| Celo USDT token | `0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e` |
| `LangclawRegistry` | `0xe69755e4249c4978c39fbe847ca9674ce7af3505` |
| `LangclawTradingJournal` | `0x69984c20176704685236fd633192d7de1c13a5ec` |
| `LangclawUsageVault` | `0x837a2948586de4e7638c742f99e520ffc049bcf7` |
| ERC-8004 agent ID | `9109` |
| Self Agent ID | `133` |

## Files That Were Part Of The Port

- `app/page.tsx`
- `app/(user)/layout.tsx`
- `components/Header.tsx`
- `components/Hero.tsx`
- `components/HomeDemoLaunchpad.tsx`
- `components/SquigglyHome.tsx`
- `components/Capabilities.tsx`
- `components/HomeDataSources.tsx`
- `components/Chat.tsx`
- `components/ChatInput.tsx`
- `components/UserLayoutShell.tsx`
- `components/app-sidebar.tsx`
- `components/LangclawLogo.tsx`
- `lib/brand-assets.ts`
- `lib/chat-model.ts`
- `next.config.ts`

## Do Not Regress

- Do not reintroduce Mantle-first labels on the default Celo UI.
- Do not replace `gpt-5.4-nano` with another frontend model ID unless the product
  contract changes.
- Do not remove the Supabase remote image host from `next.config.ts`.
- Do not point deployed HTTPS frontend rewrites to private localhost or HTTP-only
  backend URLs.
- Do not turn Strategy Lab paper trades into live trade execution copy.
- Do not fabricate provider rows or proof transactions for live Celo surfaces.

## Verification Commands

```bash
pnpm typecheck
pnpm build
```

Targeted lint, when needed:

```bash
pnpm exec eslint components/Header.tsx components/Hero.tsx components/HomeDemoLaunchpad.tsx components/SquigglyHome.tsx components/Capabilities.tsx components/HomeDataSources.tsx components/Chat.tsx components/ChatInput.tsx components/app-sidebar.tsx components/LangclawLogo.tsx components/UserLayoutShell.tsx app/page.tsx app/\(user\)/layout.tsx next.config.ts
```

Rendered QA should cover:

- `/`
- `/chat`
- `/usage`
- `/watchlist`
- `/strategy`
- `/proofs`

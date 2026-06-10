import Link from "next/link";
import {
  ArrowRightIcon,
  CircleCheckIcon,
  ExternalLinkIcon,
  FileCheck2Icon,
  LockKeyholeIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const proofLayerRows = [
  {
    href: "https://celoscan.io/address/0xe69755e4249c4978c39fbe847ca9674ce7af3505",
    label: "LangclawRegistry",
    meta: "AI decision proofs",
    value: "0xe69755e4249c4978c39fbe847ca9674ce7af3505",
  },
  {
    href: "https://celoscan.io/address/0x837a2948586de4e7638c742f99e520ffc049bcf7",
    label: "LangclawUsageVault",
    meta: "USDT usage vault",
    value: "0x837a2948586de4e7638c742f99e520ffc049bcf7",
  },
  {
    href: "https://celoscan.io/address/0x69984c20176704685236fd633192d7de1c13a5ec",
    label: "LangclawTradingJournal",
    meta: "Strategy proof journal",
    value: "0x69984c20176704685236fd633192d7de1c13a5ec",
  },
  {
    href: "https://celoscan.io/address/0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
    label: "ERC-8004 identity registry",
    meta: "Agent identity source",
    value: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
  },
  {
    label: "Langclaw agent ID",
    meta: "Registered agent identity",
    value: "9109",
  },
  {
    label: "Self Agent ID",
    meta: "Verified Celo linked identity",
    value: "133",
  },
  {
    href: "https://celoscan.io/address/0x2cA915EF6be8D2D48ccD3c5dAF715546AF873A4c",
    label: "Agent owner / recorder",
    meta: "Proof writer wallet",
    value: "0x2cA915EF6be8D2D48ccD3c5dAF715546AF873A4c",
  },
];

const deploymentRows = [
  {
    href: "https://celoscan.io/tx/0x1b7cb74378db42551a3cbc81dcd560f337df1593d4ef1cd70ee44ff269bdc7f3",
    label: "ERC-8004 registration",
    value: "0x1b7cb74378db42551a3cbc81dcd560f337df1593d4ef1cd70ee44ff269bdc7f3",
  },
  {
    href: "https://celoscan.io/tx/0x3c7d0cc69f77d2aef5ab21bfe703d0f33f7037d5e2162209d78b23b5c3f1cde6",
    label: "Self Agent ID registration",
    value: "0x3c7d0cc69f77d2aef5ab21bfe703d0f33f7037d5e2162209d78b23b5c3f1cde6",
  },
  {
    href: "https://celoscan.io/tx/0xf6f8af14295c86d2f358c32ba15d0669903b122c086dcb0b432d9df8aaec6b6c",
    label: "Registry deploy",
    value: "0xf6f8af14295c86d2f358c32ba15d0669903b122c086dcb0b432d9df8aaec6b6c",
  },
  {
    href: "https://celoscan.io/tx/0xac09eb4b164b51818775cc7f73a33cbdf88428cdc3d853c5ae7ec34999c3e6b2",
    label: "Usage vault deploy",
    value: "0xac09eb4b164b51818775cc7f73a33cbdf88428cdc3d853c5ae7ec34999c3e6b2",
  },
];

const decisionRows = [
  {
    href: "https://celoscan.io/tx/0xb50e7bd12af0cbca9a6246a80f1976da753d359fbd1553458712b43aa40681b1",
    label: "ERC-8004 decision 47",
    signal: "campaign-backend-proof",
  },
  {
    href: "https://celoscan.io/tx/0x2a2f94c40e2b5c080bd330f43f3ce6bc6b05e054b6626ce3ab2716220f0d3211",
    label: "Self-linked decision 1",
    signal: "smart-money",
  },
];

export function SquigglyHome() {
  return (
    <section className="border-y bg-background">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:px-6 lg:grid-cols-[1fr_0.9fr] lg:items-center">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <h2 className="max-w-3xl text-balance font-semibold text-3xl tracking-normal md:text-5xl">
              Built on a deployed Celo proof layer.
            </h2>
            <p className="max-w-2xl text-muted-foreground leading-7">
              Langclaw records decision hashes, evidence URIs, signal types,
              recorder wallets, and Strategy Lab outcomes through live Celo
              contracts that users can inspect after a run.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <ProofPillar
              icon={<CircleCheckIcon aria-hidden="true" />}
              title="Evidence first"
              text="Usable rows and source gaps are separated instead of blurred together."
            />
            <ProofPillar
              icon={<FileCheck2Icon aria-hidden="true" />}
              title="Contract backed"
              text="Registry, usage vault, and trading journal contracts are deployed on Celo."
            />
            <ProofPillar
              icon={<LockKeyholeIcon aria-hidden="true" />}
              title="No custody"
              text="The hackathon build evaluates signals without live-funds execution."
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/proofs">
                View Proof Center
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/watchlist">
                Open Watchlist
                <ExternalLinkIcon data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/30 p-4" id="proof-layer">
          <div className="rounded-lg border bg-background">
            <div className="flex items-start justify-between gap-4 p-4">
              <div>
                <p className="font-semibold">Deployed Celo proof layer</p>
                <p className="mt-1 text-muted-foreground text-sm">
                  Chain ID 42220, ERC-8004 agent ID 9109, Self Agent ID 133,
                  and live contract addresses from the public project docs.
                </p>
              </div>
              <Badge variant="secondary">Celo</Badge>
            </div>
            <Separator />
            <div className="grid">
              {proofLayerRows.map((row) => (
                <ProofLayerRow key={row.label} row={row} />
              ))}
            </div>
            <Separator />
            <div className="grid gap-3 p-4">
              <div>
                <p className="font-medium text-sm">Deployment transactions</p>
                <div className="mt-2 grid gap-2">
                  {deploymentRows.map((row) => (
                    <ProofLinkRow key={row.label} row={row} />
                  ))}
                </div>
              </div>
              <div>
                <p className="font-medium text-sm">Live decision examples</p>
                <div className="mt-2 grid gap-2">
                  {decisionRows.map((row) => (
                    <a
                      className="flex items-center justify-between gap-3 rounded-md border bg-muted/20 px-3 py-2 text-sm transition-colors hover:bg-muted"
                      href={row.href}
                      key={row.label}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <span className="min-w-0">
                        <span className="font-medium">{row.label}</span>
                        <span className="ml-2 text-muted-foreground">
                          {row.signal}
                        </span>
                      </span>
                      <ExternalLinkIcon
                        aria-hidden="true"
                        className="size-3.5 shrink-0 text-muted-foreground"
                      />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProofLayerRow({
  row,
}: {
  row: {
    href?: string;
    label: string;
    meta: string;
    value: string;
  };
}) {
  return (
    <div className="grid gap-2 border-b px-4 py-3 text-sm last:border-b-0 sm:grid-cols-[190px_1fr]">
      <span className="min-w-0">
        <span className="block font-medium">{row.label}</span>
        <span className="block text-muted-foreground text-xs">{row.meta}</span>
      </span>
      {row.href ? (
        <a
          className="inline-flex min-w-0 items-center gap-2 font-mono text-primary text-xs hover:underline"
          href={row.href}
          rel="noreferrer"
          target="_blank"
        >
          <span className="break-all">{row.value}</span>
          <ExternalLinkIcon
            aria-hidden="true"
            className="size-3 shrink-0 text-muted-foreground"
          />
        </a>
      ) : (
        <span className="font-mono text-xs">{row.value}</span>
      )}
    </div>
  );
}

function ProofLinkRow({
  row,
}: {
  row: {
    href: string;
    label: string;
    value: string;
  };
}) {
  return (
    <a
      className="grid gap-1 rounded-md border bg-muted/20 px-3 py-2 text-sm transition-colors hover:bg-muted"
      href={row.href}
      rel="noreferrer"
      target="_blank"
    >
      <span className="font-medium">{row.label}</span>
      <span className="break-all font-mono text-muted-foreground text-xs">
        {row.value}
      </span>
    </a>
  );
}

function ProofPillar({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <article className="rounded-lg border bg-background p-4">
      <span className="text-primary [&_svg]:size-4">{icon}</span>
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-2 text-muted-foreground text-sm leading-6">{text}</p>
    </article>
  );
}

import {
  codeFromHostname,
  fromDataSuffix,
  toDataSuffix,
} from "@celo/attribution-tags";
import type { Hash, Hex } from "viem";

export const DEFAULT_CELO_ATTRIBUTION_HOSTNAME =
  "langclawcelo.vercel.app";

type AttributionEnvironment = {
  NEXT_PUBLIC_CELO_ATTRIBUTION_CODE?: string;
  NEXT_PUBLIC_CELO_ATTRIBUTION_HOSTNAME?: string;
};

export type BuildCeloAttributionTagOptions = {
  env?: AttributionEnvironment;
  onWarning?: (message: string) => void;
};

export type CeloAttributionTag = {
  codes: string[];
  dataSuffix: Hex;
  hostname: string;
};

export type CeloAttributionVerification = {
  codes: string[];
  expectedCodes: string[];
  status: "verified" | "missing" | "mismatch" | "skipped" | "unavailable";
};

export type VerifyCeloAttributionTransactionOptions = {
  chain: string;
  getTransaction: (
    hash: Hash,
  ) => Promise<{ input?: string } | null | undefined>;
  hash: Hash;
  options?: BuildCeloAttributionTagOptions;
};

export function buildCeloAttributionTag({
  env = readPublicAttributionEnvironment(),
  onWarning = defaultWarning,
}: BuildCeloAttributionTagOptions = {}): CeloAttributionTag {
  const configuredHostname = env.NEXT_PUBLIC_CELO_ATTRIBUTION_HOSTNAME?.trim();
  let hostname = configuredHostname || DEFAULT_CELO_ATTRIBUTION_HOSTNAME;
  let hostnameCode: string;

  try {
    hostnameCode = codeFromHostname(hostname);
  } catch {
    onWarning(
      "NEXT_PUBLIC_CELO_ATTRIBUTION_HOSTNAME is invalid. Using the production hostname.",
    );
    hostname = DEFAULT_CELO_ATTRIBUTION_HOSTNAME;
    hostnameCode = codeFromHostname(hostname);
  }

  const codes = [hostnameCode];
  const officialCode = env.NEXT_PUBLIC_CELO_ATTRIBUTION_CODE?.trim();

  if (officialCode && officialCode !== hostnameCode) {
    if (officialCode === "minipay") {
      onWarning(
        "MiniPay adds its platform attribution code. Langclaw will not add it.",
      );
    } else if (isValidAttributionCode(officialCode)) {
      codes.push(officialCode);
    } else {
      onWarning(
        "NEXT_PUBLIC_CELO_ATTRIBUTION_CODE is invalid. Using hostname attribution only.",
      );
    }
  }

  return {
    codes,
    dataSuffix: toDataSuffix(codes),
    hostname,
  };
}

export function withCeloAttribution<T extends Record<string, unknown>>(
  chain: string,
  request: T,
  options: BuildCeloAttributionTagOptions = {},
): T & { dataSuffix?: Hex } {
  if (chain !== "celo") {
    return request;
  }

  return {
    ...request,
    dataSuffix: buildCeloAttributionTag(options).dataSuffix,
  };
}

export async function verifyCeloAttributionTransaction({
  chain,
  getTransaction,
  hash,
  options = {},
}: VerifyCeloAttributionTransactionOptions): Promise<CeloAttributionVerification> {
  if (chain !== "celo") {
    return { codes: [], expectedCodes: [], status: "skipped" };
  }

  const expectedCodes = buildCeloAttributionTag(options).codes;

  try {
    const transaction = await getTransaction(hash);
    const input = transaction?.input;

    if (!input?.startsWith("0x")) {
      return { codes: [], expectedCodes, status: "missing" };
    }

    const decoded = fromDataSuffix(input as Hex);

    if (!decoded) {
      return { codes: [], expectedCodes, status: "missing" };
    }

    return {
      codes: decoded.codes,
      expectedCodes,
      status: containsCodesInOrder(decoded.codes, expectedCodes)
        ? "verified"
        : "mismatch",
    };
  } catch {
    return { codes: [], expectedCodes, status: "unavailable" };
  }
}

function readPublicAttributionEnvironment(): AttributionEnvironment {
  return {
    NEXT_PUBLIC_CELO_ATTRIBUTION_CODE:
      process.env.NEXT_PUBLIC_CELO_ATTRIBUTION_CODE,
    NEXT_PUBLIC_CELO_ATTRIBUTION_HOSTNAME:
      process.env.NEXT_PUBLIC_CELO_ATTRIBUTION_HOSTNAME,
  };
}

function isValidAttributionCode(code: string) {
  try {
    toDataSuffix(code);
    return true;
  } catch {
    return false;
  }
}

function containsCodesInOrder(codes: string[], expectedCodes: string[]) {
  let expectedIndex = 0;

  for (const code of codes) {
    if (code === expectedCodes[expectedIndex]) {
      expectedIndex += 1;
    }
  }

  return expectedIndex === expectedCodes.length;
}

function defaultWarning(message: string) {
  console.warn(`[celo-attribution] ${message}`);
}

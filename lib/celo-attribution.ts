import { codeFromHostname, toDataSuffix } from "@celo/attribution-tags";
import type { Hex } from "viem";

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

function defaultWarning(message: string) {
  console.warn(`[celo-attribution] ${message}`);
}

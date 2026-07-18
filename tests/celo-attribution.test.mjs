import assert from "node:assert/strict";
import test from "node:test";

import { fromDataSuffix } from "@celo/attribution-tags";

import {
  buildCeloAttributionTag,
  DEFAULT_CELO_ATTRIBUTION_HOSTNAME,
  withCeloAttribution,
} from "../lib/celo-attribution.ts";

test("builds the default Celo attribution tag from the production hostname", () => {
  const attribution = buildCeloAttributionTag({ env: {} });

  assert.equal(attribution.hostname, DEFAULT_CELO_ATTRIBUTION_HOSTNAME);
  assert.deepEqual(attribution.codes, ["celo_1a98738636db"]);
  assert.deepEqual(fromDataSuffix(attribution.dataSuffix), {
    codes: ["celo_1a98738636db"],
    schemaId: 0,
  });
});

test("places a valid official code after the hostname code", () => {
  const attribution = buildCeloAttributionTag({
    env: {
      NEXT_PUBLIC_CELO_ATTRIBUTION_CODE: "langclaw",
      NEXT_PUBLIC_CELO_ATTRIBUTION_HOSTNAME: "example.com",
    },
  });

  assert.equal(attribution.hostname, "example.com");
  assert.equal(attribution.codes[0].startsWith("celo_"), true);
  assert.deepEqual(attribution.codes.slice(1), ["langclaw"]);
  assert.deepEqual(fromDataSuffix(attribution.dataSuffix)?.codes, attribution.codes);
});

test("keeps hostname attribution when the optional official code is invalid", () => {
  const warnings = [];
  const attribution = buildCeloAttributionTag({
    env: { NEXT_PUBLIC_CELO_ATTRIBUTION_CODE: "NOT VALID" },
    onWarning: (warning) => warnings.push(warning),
  });

  assert.deepEqual(attribution.codes, ["celo_1a98738636db"]);
  assert.match(warnings[0] ?? "", /NEXT_PUBLIC_CELO_ATTRIBUTION_CODE/);
});

test("never adds the MiniPay platform code", () => {
  const warnings = [];
  const attribution = buildCeloAttributionTag({
    env: { NEXT_PUBLIC_CELO_ATTRIBUTION_CODE: "minipay" },
    onWarning: (warning) => warnings.push(warning),
  });

  assert.deepEqual(attribution.codes, ["celo_1a98738636db"]);
  assert.match(warnings[0] ?? "", /MiniPay/);
});

test("falls back to the production hostname when configuration is invalid", () => {
  const warnings = [];
  const attribution = buildCeloAttributionTag({
    env: {
      NEXT_PUBLIC_CELO_ATTRIBUTION_HOSTNAME: "https://invalid.example",
    },
    onWarning: (warning) => warnings.push(warning),
  });

  assert.equal(attribution.hostname, DEFAULT_CELO_ATTRIBUTION_HOSTNAME);
  assert.deepEqual(attribution.codes, ["celo_1a98738636db"]);
  assert.match(warnings[0] ?? "", /NEXT_PUBLIC_CELO_ATTRIBUTION_HOSTNAME/);
});

test("adds attribution only to Celo contract write requests", () => {
  const request = {
    address: "0x1111111111111111111111111111111111111111",
  };

  const celoRequest = withCeloAttribution("celo", request, { env: {} });
  const mantleRequest = withCeloAttribution("mantle", request, { env: {} });

  assert.equal(
    celoRequest.dataSuffix,
    "0x63656c6f5f316139383733383633366462110080218021802180218021802180218021",
  );
  assert.equal("dataSuffix" in mantleRequest, false);
  assert.equal(mantleRequest, request);
});

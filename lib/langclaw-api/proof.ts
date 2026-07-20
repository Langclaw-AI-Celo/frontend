import {
  LangclawApiError,
  isEvmAddressResponse,
  isNonEmptyResponseString,
  isOptionalProductChain,
  isOptionalResponseString,
  isPositiveResponseInteger,
  isResponseObject,
  isTransactionHashResponse,
  isUnsignedIntegerString,
  isValidResponseTimestamp,
  postJson,
  readJsonResponse,
} from "./core.ts";

import type { ProductChainId, ProofDecision, ProofDecisionsPayload } from "./types.ts";

export async function listProofDecisions(limit = 20, chain?: ProductChainId) {
  const response = await postJson("/api/proofs/decisions", { chain, limit });
  const payload = await readJsonResponse<ProofDecisionsPayload>(response);

  if (!isProofDecisionsPayload(payload)) {
    throw new LangclawApiError(
      "Backend returned invalid proof decision data.",
      500,
    );
  }

  return payload;
}

function isProofDecisionsPayload(
  value: unknown,
): value is ProofDecisionsPayload {
  if (!isResponseObject(value)) {
    return false;
  }

  return (
    value.configured === true &&
    isOptionalProductChain(value.chain) &&
    isPositiveResponseInteger(value.chainId) &&
    isOptionalResponseString(value.chainName) &&
    isOptionalResponseString(value.nativeSymbol) &&
    Array.isArray(value.decisions) &&
    value.decisions.every(isProofDecision) &&
    isUnsignedIntegerString(value.nextDecisionId) &&
    isEvmAddressResponse(value.registryAddress)
  );
}

function isProofDecision(value: unknown): value is ProofDecision {
  if (!isResponseObject(value)) {
    return false;
  }

  return (
    isUnsignedIntegerString(value.agentId) &&
    isValidResponseTimestamp(value.createdAt) &&
    isTransactionHashResponse(value.decisionHash) &&
    isUnsignedIntegerString(value.decisionId) &&
    isNonEmptyResponseString(value.evidenceUri) &&
    isOptionalResponseString(value.explorerUrl) &&
    isEvmAddressResponse(value.recorder) &&
    isNonEmptyResponseString(value.runId) &&
    isNonEmptyResponseString(value.signalType) &&
    (value.txHash === undefined || isTransactionHashResponse(value.txHash))
  );
}

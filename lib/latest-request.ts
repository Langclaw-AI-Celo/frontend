export function createLatestRequestGuard() {
  let generation = 0;

  return {
    begin() {
      const requestGeneration = ++generation;

      return {
        isCurrent() {
          return requestGeneration === generation;
        },
      };
    },
    invalidate() {
      generation += 1;
    },
  };
}

type LatestRequestHandlers<T> = {
  onError: (error: unknown) => void;
  onSettled?: () => void;
  onSuccess: (value: T) => void;
};

export function createUsageRequestCoordinator(initialContext: string) {
  const balanceGuard = createLatestRequestGuard();
  const depositGuard = createLatestRequestGuard();
  const quoteGuard = createLatestRequestGuard();
  const vaultGuard = createLatestRequestGuard();
  const vaultStateGuard = createLatestRequestGuard();
  const withdrawGuard = createLatestRequestGuard();
  const guards = [
    balanceGuard,
    depositGuard,
    quoteGuard,
    vaultGuard,
    vaultStateGuard,
    withdrawGuard,
  ];
  let currentContext = initialContext;

  const run = <T>(
    guard: ReturnType<typeof createLatestRequestGuard>,
    requestContext: string,
    load: () => Promise<T>,
    handlers: LatestRequestHandlers<T>,
  ) => {
    if (requestContext !== currentContext) {
      return Promise.resolve(false);
    }

    return runLatestRequest(guard, load, handlers);
  };

  return {
    isCurrentContext(context: string) {
      return context === currentContext;
    },
    invalidateBalance() {
      balanceGuard.invalidate();
    },
    runBalance<T>(
      context: string,
      load: () => Promise<T>,
      handlers: LatestRequestHandlers<T>,
    ) {
      return run(balanceGuard, context, load, handlers);
    },
    runDeposit<T>(
      context: string,
      load: () => Promise<T>,
      handlers: LatestRequestHandlers<T>,
    ) {
      return run(depositGuard, context, load, handlers);
    },
    runQuote<T>(
      context: string,
      load: () => Promise<T>,
      handlers: LatestRequestHandlers<T>,
    ) {
      return run(quoteGuard, context, load, handlers);
    },
    runVault<T>(
      context: string,
      load: () => Promise<T>,
      handlers: LatestRequestHandlers<T>,
    ) {
      return run(vaultGuard, context, load, handlers);
    },
    runVaultState<T>(
      context: string,
      load: () => Promise<T>,
      handlers: LatestRequestHandlers<T>,
    ) {
      return run(vaultStateGuard, context, load, handlers);
    },
    runWithdraw<T>(
      context: string,
      load: () => Promise<T>,
      handlers: LatestRequestHandlers<T>,
    ) {
      return run(withdrawGuard, context, load, handlers);
    },
    setContext(context: string) {
      if (context === currentContext) {
        return;
      }

      currentContext = context;
      for (const guard of guards) {
        guard.invalidate();
      }
    },
  };
}

export function shouldResetMiniPayChain(
  isMiniPay: boolean,
  selectedChain: string,
) {
  return isMiniPay && selectedChain !== "celo";
}

export function shouldDisableBalanceRefresh({
  isBalanceLoading,
  isConnected,
  isSigning,
  operationLoading,
}: {
  isBalanceLoading: boolean;
  isConnected: boolean;
  isSigning: boolean;
  operationLoading: string;
}) {
  return (
    !isConnected || isBalanceLoading || isSigning || Boolean(operationLoading)
  );
}

export function shouldDisableChainSelection({
  isConfirmingTransaction,
  isPendingTransaction,
  isSigning,
  operationLoading,
}: {
  isConfirmingTransaction: boolean;
  isPendingTransaction: boolean;
  isSigning: boolean;
  operationLoading: string;
}) {
  return (
    isConfirmingTransaction ||
    isPendingTransaction ||
    isSigning ||
    operationLoading === "send-deposit" ||
    operationLoading === "onchain-withdraw"
  );
}

export async function runLatestRequest<T>(
  guard: ReturnType<typeof createLatestRequestGuard>,
  load: () => Promise<T>,
  handlers: LatestRequestHandlers<T>,
) {
  const request = guard.begin();

  try {
    const value = await load();

    if (!request.isCurrent()) {
      return false;
    }

    handlers.onSuccess(value);
    return true;
  } catch (error) {
    if (!request.isCurrent()) {
      return false;
    }

    handlers.onError(error);
    return true;
  } finally {
    if (request.isCurrent()) {
      handlers.onSettled?.();
    }
  }
}

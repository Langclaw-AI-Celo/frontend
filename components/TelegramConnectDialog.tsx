"use client";

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  Bot,
  CheckCircle2,
  CopyIcon,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useWalletSession } from "@/hooks/use-wallet-session";
import { safeExternalUrl } from "@/lib/external-url";
import { createTelegramGateRequestCoordinator } from "@/lib/latest-request";
import {
  createAutomationTelegramLink,
  getAutomationSettings,
  pollAutomationTelegramLink,
  readFriendlyError,
  type ProductChainId,
  type WalletAuth,
} from "@/lib/langclaw-api";

export class TelegramLinkRequiredError extends Error {
  constructor() {
    super("Telegram connection is required.");
    this.name = "TelegramLinkRequiredError";
  }
}

export function isTelegramLinkRequiredError(error: unknown) {
  return (
    error instanceof TelegramLinkRequiredError ||
    (error instanceof Error &&
      /(telegram connection is required|connect telegram to continue)/i.test(
        error.message,
      ))
  );
}

export function useTelegramConnectGate() {
  const { address, getWalletAuth, isConnected, openWalletModal } =
    useWalletSession();
  const walletContext =
    isConnected && address ? address.trim().toLowerCase() : "";
  const [open, setOpen] = useState(false);
  const [telegramCommand, setTelegramCommand] = useState("");
  const [telegramDeepLink, setTelegramDeepLink] = useState("");
  const [telegramBotUsername, setTelegramBotUsername] =
    useState("langclawaibot");
  const [telegramPolling, setTelegramPolling] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const pollTimerRef = useRef<number | null>(null);
  const requiredChainRef = useRef<ProductChainId | undefined>(undefined);
  const telegramRequestsRef = useRef(
    createTelegramGateRequestCoordinator(walletContext),
  );

  const clearTelegramPollTimer = useCallback(() => {
    if (pollTimerRef.current !== null) {
      window.clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  useLayoutEffect(() => {
    const contextChanged =
      telegramRequestsRef.current.setContext(walletContext);

    if (!contextChanged) {
      return;
    }

    clearTelegramPollTimer();
    requiredChainRef.current = undefined;
    setLoading(false);
    setOpen(false);
    setTelegramCommand("");
    setTelegramDeepLink("");
    setTelegramPolling(false);
    setTelegramStatus("");
  }, [clearTelegramPollTimer, walletContext]);

  useLayoutEffect(() => {
    const telegramRequests = telegramRequestsRef.current;

    return () => {
      clearTelegramPollTimer();
      telegramRequests.invalidateAll();
    };
  }, [clearTelegramPollTimer]);

  const startTelegramPolling = useCallback(
    (wallet: WalletAuth, expiresAt: string, botUsername: string) => {
      const request =
        telegramRequestsRef.current.beginPoll(walletContext);

      if (!request.isCurrent(wallet.address)) {
        return;
      }

      const expiresAtMs = new Date(expiresAt).getTime();
      clearTelegramPollTimer();
      setTelegramPolling(true);
      setTelegramStatus(`Waiting for @${botUsername} confirmation...`);

      const poll = async () => {
        if (!request.isCurrent(wallet.address)) {
          return;
        }

        if (Date.now() >= expiresAtMs) {
          setTelegramPolling(false);
          setTelegramStatus("Telegram link expired. Create a new link.");
          return;
        }

        try {
          const payload = await pollAutomationTelegramLink(wallet);

          if (!request.isCurrent(wallet.address)) {
            return;
          }

          if (payload.linked) {
            setTelegramPolling(false);
            setTelegramStatus("Telegram linked.");
            setTelegramCommand("");
            setTelegramDeepLink("");
            setOpen(false);
            toast.success("Telegram linked");
            return;
          }

          setTelegramStatus(`Waiting for @${botUsername} confirmation...`);
          pollTimerRef.current = window.setTimeout(poll, 3000);
        } catch (error) {
          if (!request.isCurrent(wallet.address)) {
            return;
          }

          const message = readFriendlyError(
            error,
            "Unable to check Telegram link.",
          );
          setTelegramPolling(false);
          setTelegramStatus(message);
          toast.error(message);
        }
      };

      pollTimerRef.current = window.setTimeout(poll, 1500);
    },
    [clearTelegramPollTimer, walletContext],
  );

  const requireTelegramLinkedWallet = useCallback(
    async (options: { chain?: ProductChainId; force?: boolean } = {}) => {
      if (!isConnected || !walletContext) {
        openWalletModal();
        throw new Error("Choose a wallet to continue.");
      }

      const request =
        telegramRequestsRef.current.beginGate(walletContext);
      requiredChainRef.current = options.chain;
      const wallet = await getWalletAuth({
        chain: options.chain,
        force: options.force,
      });

      if (!request.isCurrent(wallet.address)) {
        throw new Error("Wallet changed. Try again.");
      }

      const settings = await getAutomationSettings(wallet);

      if (!request.isCurrent(wallet.address)) {
        throw new Error("Wallet changed. Try again.");
      }

      if (settings.telegramVerified && settings.telegramChatId?.trim()) {
        return wallet;
      }

      setOpen(true);
      setTelegramStatus("Connect Telegram before running Langclaw.");
      throw new TelegramLinkRequiredError();
    },
    [
      getWalletAuth,
      isConnected,
      openWalletModal,
      setOpen,
      setTelegramStatus,
      walletContext,
    ],
  );

  const handleConnectTelegram = useCallback(async () => {
    const request =
      telegramRequestsRef.current.beginLink(walletContext);

    if (!request.isCurrent()) {
      return;
    }

    setLoading(true);
    clearTelegramPollTimer();

    const telegramWindow = window.open("about:blank", "_blank");

    try {
      const wallet = await getWalletAuth({ chain: requiredChainRef.current });

      if (!request.isCurrent(wallet.address)) {
        telegramWindow?.close();
        return;
      }

      const link = await createAutomationTelegramLink(wallet);

      if (!request.isCurrent(wallet.address)) {
        telegramWindow?.close();
        return;
      }

      const deepLink = safeExternalUrl(link.deepLink);

      if (!deepLink) {
        throw new Error("Telegram returned an invalid link.");
      }

      setTelegramCommand(link.command);
      setTelegramDeepLink(deepLink);
      setTelegramBotUsername(link.botUsername);
      setTelegramStatus(`Waiting for @${link.botUsername} confirmation...`);

      if (telegramWindow) {
        telegramWindow.opener = null;
        telegramWindow.location.href = deepLink;
      } else {
        setTelegramStatus(
          `Open @${link.botUsername} and send the fallback command below.`,
        );
      }

      startTelegramPolling(wallet, link.expiresAt, link.botUsername);
      toast.success("Telegram link opened", {
        description: `Confirm the chat with @${link.botUsername}.`,
      });
    } catch (error) {
      telegramWindow?.close();

      if (!request.isCurrent()) {
        return;
      }

      const message = readFriendlyError(error, "Unable to create Telegram link.");

      setTelegramStatus(message);
      toast.error(message);
    } finally {
      if (request.isCurrent()) {
        setLoading(false);
      }
    }
  }, [
    clearTelegramPollTimer,
    getWalletAuth,
    setLoading,
    setTelegramBotUsername,
    setTelegramCommand,
    setTelegramDeepLink,
    setTelegramStatus,
    startTelegramPolling,
    walletContext,
  ]);

  const dialog = (
    <TelegramConnectDialog
      botUsername={telegramBotUsername}
      command={telegramCommand}
      deepLink={telegramDeepLink}
      loading={loading}
      onConnect={handleConnectTelegram}
      onOpenChange={setOpen}
      open={open}
      polling={telegramPolling}
      status={telegramStatus}
    />
  );

  return {
    dialog,
    openTelegramDialog: () => setOpen(true),
    requireTelegramLinkedWallet,
  };
}

function TelegramConnectDialog({
  botUsername,
  command,
  deepLink,
  loading,
  onConnect,
  onOpenChange,
  open,
  polling,
  status,
}: {
  botUsername: string;
  command: string;
  deepLink: string;
  loading: boolean;
  onConnect: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  polling: boolean;
  status: string;
}) {
  const copyCommand = async () => {
    if (!command) {
      return;
    }

    await navigator.clipboard.writeText(command);
    toast.success("Telegram command copied");
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-[25rem]">
        <DialogHeader>
          <DialogTitle>Connect Telegram</DialogTitle>
          <DialogDescription>
            Link Telegram to receive Celo alpha alerts before running Langclaw.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm">
            {polling ? (
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            ) : (
              <CheckCircle2 className="size-4 text-muted-foreground" />
            )}
            <span className="min-w-0 flex-1">
              {status || `Open @${botUsername} to verify this wallet.`}
            </span>
          </div>

          {command && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Fallback command
              </p>
              <div className="flex min-w-0 items-center gap-2 rounded-md border bg-background p-2">
                <code className="min-w-0 flex-1 truncate text-xs">
                  {command}
                </code>
                <Button
                  aria-label="Copy Telegram command"
                  onClick={() => void copyCommand()}
                  size="icon-sm"
                  type="button"
                  variant="ghost"
                >
                  <CopyIcon className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {deepLink && (
            <Button asChild type="button" variant="outline">
              <a
                href={safeExternalUrl(deepLink)}
                rel="noreferrer"
                target="_blank"
              >
                <ExternalLink className="size-4" />
                Open Telegram
              </a>
            </Button>
          )}
          <Button
            disabled={loading || polling}
            onClick={onConnect}
            type="button"
          >
            {loading || polling ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Bot className="size-4" />
            )}
            Connect Telegram
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

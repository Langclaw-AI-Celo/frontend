"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  CheckIcon,
  CopyIcon,
  KeyRoundIcon,
  Loader2Icon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useWalletSession } from "@/hooks/use-wallet-session";
import {
  createApiKey,
  listApiKeys,
  readFriendlyError,
  revokeApiKey,
  type ApiKeyRecord,
  type WalletAuthPurpose,
} from "@/lib/langclaw-api";
import { createApiKeyRequestCoordinator } from "@/lib/latest-request";

export default function CreateKey() {
  const { address, getWalletAuth, isConnected, isSigning, openWalletModal } =
    useWalletSession();
  const [keysState, setKeys] = useState<ApiKeyRecord[]>([]);
  const [nameState, setName] = useState("");
  const [secretState, setSecret] = useState("");
  const [errorState, setError] = useState("");
  const [loadingState, setLoading] = useState("");
  const [openState, setOpen] = useState(false);
  const [copiedIdState, setCopiedId] = useState<string | null>(null);
  const [stateContext, setStateContext] = useState("");
  const walletContext =
    isConnected && address ? address.trim().toLowerCase() : "";
  const apiKeyRequestsRef = useRef(
    createApiKeyRequestCoordinator(walletContext),
  );
  const accountStateIsCurrent = stateContext === walletContext;
  const keys = accountStateIsCurrent ? keysState : [];
  const name = accountStateIsCurrent ? nameState : "";
  const secret = accountStateIsCurrent ? secretState : "";
  const error = accountStateIsCurrent ? errorState : "";
  const loading = accountStateIsCurrent ? loadingState : "";
  const open = accountStateIsCurrent ? openState : false;
  const copiedId = accountStateIsCurrent ? copiedIdState : null;

  const getWalletForContext = useCallback(
    async (requestContext: string, purpose?: WalletAuthPurpose) => {
      const wallet = await getWalletAuth(
        purpose ? { force: true, purpose } : undefined,
      );

      if (
        !apiKeyRequestsRef.current.isCurrentContext(requestContext) ||
        wallet.address.trim().toLowerCase() !== requestContext
      ) {
        return null;
      }

      return wallet;
    },
    [getWalletAuth],
  );

  const loadKeys = useCallback(async () => {
    const requestContext = walletContext;

    if (
      !requestContext ||
      !apiKeyRequestsRef.current.isCurrentContext(requestContext)
    ) {
      return;
    }

    setLoading("list");
    setError("");

    await apiKeyRequestsRef.current.runLoad(
      requestContext,
      async () => {
        const wallet = await getWalletForContext(requestContext);

        return wallet ? listApiKeys(wallet) : null;
      },
      {
        onError: (err) => {
          const message = readFriendlyError(err, "Unable to load API keys.");
          setError(message);
          toast.error(message);
        },
        onSettled: () => setLoading(""),
        onSuccess: (payload) => {
          if (!payload) {
            return;
          }

          setStateContext(requestContext);
          setKeys(payload);
        },
      },
    );
  }, [getWalletForContext, walletContext]);

  useLayoutEffect(() => {
    apiKeyRequestsRef.current.setContext(walletContext);
  }, [walletContext]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setKeys([]);
      setName("");
      setSecret("");
      setError("");
      setLoading("");
      setOpen(false);
      setCopiedId(null);
      setStateContext(walletContext);

      if (walletContext) {
        void loadKeys();
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadKeys, walletContext]);

  useEffect(() => {
    const apiKeyRequests = apiKeyRequestsRef.current;

    return () => apiKeyRequests.invalidateAll();
  }, []);

  const runApiKeyMutation = useCallback(
    async <T,>(
      nextLoading: string,
      fallbackError: string,
      purpose: WalletAuthPurpose | undefined,
      operation: (
        wallet: NonNullable<
          Awaited<ReturnType<typeof getWalletForContext>>
        >,
      ) => Promise<T>,
      onSuccess: (value: T) => void,
    ) => {
      const requestContext = walletContext;

      if (!requestContext) {
        const message = "Choose a wallet to manage API keys.";
        setStateContext("");
        setError(message);
        toast.error(message);
        openWalletModal();
        return false;
      }

      setLoading(nextLoading);
      setError("");

      return apiKeyRequestsRef.current.runMutation(
        requestContext,
        async () => {
          const wallet = await getWalletForContext(requestContext, purpose);

          if (!wallet) {
            return null;
          }

          return { value: await operation(wallet) };
        },
        {
          onError: (err) => {
            const message = readFriendlyError(err, fallbackError);
            setError(message);
            toast.error(message);
          },
          onSettled: () => setLoading(""),
          onSuccess: (result) => {
            if (!result) {
              return;
            }

            setStateContext(requestContext);
            onSuccess(result.value);
          },
        },
      );
    },
    [getWalletForContext, openWalletModal, walletContext],
  );

  const handleCreate = async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Give this key a short name.");
      return;
    }

    await runApiKeyMutation(
      "create",
      "Unable to create API key.",
      "api-key:create",
      (wallet) => createApiKey(wallet, trimmedName),
      (payload) => {
        setKeys((current) => [payload.key, ...current]);
        setSecret(payload.secret);
        setName("");
        setOpen(false);
        toast.success("API key created");
      },
    );
  };

  const handleRevoke = async (keyId: string) => {
    await runApiKeyMutation(
      keyId,
      "Unable to revoke API key.",
      undefined,
      (wallet) => revokeApiKey(wallet, keyId),
      (revoked) => {
        setKeys((current) =>
          current.map((key) => (key.id === keyId ? revoked : key)),
        );
        toast.success("API key revoked");
      },
    );
  };

  const copyToClipboard = async (text: string, id: string) => {
    if (!text) {
      return;
    }

    try {
      const requestContext = walletContext;
      await navigator.clipboard.writeText(text);

      if (!apiKeyRequestsRef.current.isCurrentContext(requestContext)) {
        return;
      }

      setCopiedId(id);
      toast.success("Copied to clipboard");
      window.setTimeout(() => {
        if (apiKeyRequestsRef.current.isCurrentContext(requestContext)) {
          setCopiedId(null);
        }
      }, 1500);
    } catch {
      if (apiKeyRequestsRef.current.isCurrentContext(walletContext)) {
        toast.error("Could not copy to clipboard");
      }
    }
  };

  return (
    <div className="space-y-4">
      <Card className="rounded-lg" size="sm">
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>
            Create server-side keys for apps that call Langclaw directly.
          </CardDescription>
          <CardAction className="flex gap-2">
            <Button
              disabled={loading === "list"}
              onClick={() => void loadKeys()}
              size="sm"
              variant="outline"
            >
              {loading === "list" && (
                <Loader2Icon className="size-4 animate-spin" />
              )}
              Refresh
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button disabled={isSigning || keys.filter((key) => key.status === "active").length >= 3} size="sm">
                  <PlusIcon className="size-4" />
                  New key
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create API key</DialogTitle>
                  <DialogDescription>
                    The secret is shown once. Store it in your server
                    environment.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <Input
                    aria-label="API key name"
                    onChange={(event) => setName(event.currentTarget.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        void handleCreate();
                      }
                    }}
                    placeholder="Production server"
                    value={name}
                  />
                  <Button
                    disabled={loading === "create" || isSigning}
                    onClick={() => void handleCreate()}
                  >
                    {loading === "create" ? (
                      <Loader2Icon className="size-4 animate-spin" />
                    ) : (
                      <KeyRoundIcon className="size-4" />
                    )}
                    Create key
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Something needs attention</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {secret && (
            <Alert>
              <KeyRoundIcon className="size-4" />
              <AlertTitle>Secret key created</AlertTitle>
              <AlertDescription className="space-y-3">
                <span className="block">
                  This is the only time the full key is shown.
                </span>
                <div className="flex min-w-0 items-start gap-2 rounded-md border bg-muted/30 p-2">
                  <code className="min-w-0 flex-1 break-all font-mono text-xs select-text">
                    {secret}
                  </code>
                  <Button
                    aria-label="Copy API key secret"
                    onClick={() => void copyToClipboard(secret, "secret")}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    {copiedId === "secret" ? (
                      <CheckIcon className="size-3" />
                    ) : (
                      <CopyIcon className="size-3" />
                    )}
                    {copiedId === "secret" ? "Copied" : "Copy"}
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.length ? (
                keys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.name}</TableCell>
                    <TableCell className="max-w-56">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <code className="min-w-0 flex-1 truncate font-mono text-xs">
                          {key.maskedKey}
                        </code>
                        <Button
                          aria-label={`Copy key ${key.name}`}
                          onClick={() =>
                            void copyToClipboard(key.maskedKey, key.id)
                          }
                          size="icon-xs"
                          type="button"
                          variant="ghost"
                        >
                          {copiedId === key.id ? (
                            <CheckIcon className="size-3" />
                          ) : (
                            <CopyIcon className="size-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{key.status}</TableCell>
                    <TableCell>{formatDate(key.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        disabled={key.status !== "active" || loading === key.id}
                        onClick={() => void handleRevoke(key.id)}
                        size="sm"
                        variant="destructive"
                      >
                        {loading === key.id ? (
                          <Loader2Icon className="size-4 animate-spin" />
                        ) : (
                          <Trash2Icon className="size-4" />
                        )}
                        Revoke
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    className="py-8 text-center text-muted-foreground"
                    colSpan={5}
                  >
                    {isConnected
                      ? "No API keys yet."
                      : "Choose a wallet to load API keys."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function formatDate(value?: string) {
  if (!value) {
    return "Not used";
  }

  return new Date(value).toLocaleString();
}

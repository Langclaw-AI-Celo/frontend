"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertCircle,
  BrainCircuit,
  Database,
  Loader2,
  RefreshCw,
  ShieldCheck,
  ToggleLeft,
} from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useWalletSession } from "@/hooks/use-wallet-session";
import {
  deleteManyMemoryRecords,
  deleteMemoryRecord,
  getMemoryDashboard,
  readFriendlyError,
  setManyMemoryStatuses,
  setMemoryStatus,
  type MemoryItem,
  type MemoryStats,
  type MemoryStatus,
} from "@/lib/langclaw-api";
import { createMemoryRequestCoordinator } from "@/lib/latest-request";
import { MemoryDataTable } from "./data-table";

const EMPTY_MEMORIES: MemoryItem[] = [];

export default function Page() {
  const { address, getWalletAuth, isConnected, isSigning, openWalletModal } =
    useWalletSession();
  const [memoriesState, setMemories] = useState<MemoryItem[]>([]);
  const [backendStatsState, setBackendStats] =
    useState<MemoryStats | null>(null);
  const [errorState, setError] = useState("");
  const [loadingState, setLoading] = useState("");
  const [memoryContext, setMemoryContext] = useState("");
  const walletContext =
    isConnected && address ? address.trim().toLowerCase() : "";
  const memoryRequestsRef = useRef(
    createMemoryRequestCoordinator(walletContext),
  );
  const memoryContextRef = useRef("");
  const accountStateIsCurrent =
    Boolean(walletContext) && memoryContext === walletContext;
  const memories = accountStateIsCurrent ? memoriesState : EMPTY_MEMORIES;
  const backendStats = accountStateIsCurrent ? backendStatsState : null;
  const error = accountStateIsCurrent ? errorState : "";
  const loading = accountStateIsCurrent ? loadingState : "";

  const stats = useMemo(
    () => backendStats ?? buildMemoryStats(memories),
    [backendStats, memories],
  );

  const statCards = useMemo(
    () => [
      {
        label: "Total memories",
        value: stats.total,
        description: "Captured across chats",
        icon: Database,
      },
      {
        label: "Active",
        value: stats.active,
        description: "Available for recall",
        icon: BrainCircuit,
      },
      {
        label: "Project scoped",
        value: stats.projectScoped,
        description: "Attached to workspaces",
        icon: ShieldCheck,
      },
      {
        label: "Disabled",
        value: stats.disabled,
        description: "Kept but not reused",
        icon: ToggleLeft,
      },
    ],
    [stats],
  );

  const getWalletForContext = useCallback(
    async (requestContext: string) => {
      const wallet = await getWalletAuth();

      if (
        !memoryRequestsRef.current.isCurrentContext(requestContext) ||
        wallet.address.trim().toLowerCase() !== requestContext
      ) {
        return null;
      }

      return wallet;
    },
    [getWalletAuth],
  );

  const loadMemories = useCallback(async () => {
    const requestContext = walletContext;

    if (!memoryRequestsRef.current.isCurrentContext(requestContext)) {
      return;
    }

    setLoading("load");
    setError("");

    await memoryRequestsRef.current.runLoad(
      requestContext,
      async () => {
        const wallet = await getWalletForContext(requestContext);

        if (!wallet) {
          return null;
        }

        return getMemoryDashboard(wallet);
      },
      {
        onError: (err) => {
          const message = readFriendlyError(err, "Unable to load memories.");
          setError(message);
          toast.error(message);
        },
        onSettled: () =>
          setLoading((current) => (current === "load" ? "" : current)),
        onSuccess: (dashboard) => {
          if (!dashboard) {
            return;
          }

          memoryContextRef.current = requestContext;
          setMemoryContext(requestContext);
          setMemories(dashboard.memories);
          setBackendStats(dashboard.stats);
        },
      },
    );
  }, [getWalletForContext, walletContext]);

  useLayoutEffect(() => {
    memoryRequestsRef.current.setContext(walletContext);
    memoryContextRef.current = "";
  }, [walletContext]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setMemories([]);
      setBackendStats(null);
      setError("");
      setLoading("");
      memoryContextRef.current = walletContext;
      setMemoryContext(walletContext);

      if (walletContext) {
        void loadMemories();
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadMemories, walletContext]);

  useEffect(() => {
    const memoryRequests = memoryRequestsRef.current;

    return () => {
      memoryRequests.invalidateAll();
    };
  }, []);

  const runMemoryMutation = useCallback(
    async <T,>(
      nextLoadingState: string,
      fallbackError: string,
      operation: (
        wallet: NonNullable<Awaited<ReturnType<typeof getWalletForContext>>>,
      ) => Promise<T>,
      onSuccess: (value: T, requestContext: string) => void,
    ) => {
      const requestContext = walletContext;

      if (!requestContext) {
        const message = "Choose a wallet to manage memories.";
        setError(message);
        toast.error(message);
        openWalletModal();
        return false;
      }

      if (
        !memoryRequestsRef.current.isCurrentContext(requestContext) ||
        memoryContextRef.current !== requestContext
      ) {
        return false;
      }

      setLoading(nextLoadingState);
      setError("");

      return memoryRequestsRef.current.runMutation(
        requestContext,
        memoryContextRef.current,
        async () => {
          const wallet = await getWalletForContext(requestContext);

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
          onSettled: () =>
            setLoading((current) =>
              current === nextLoadingState ? "" : current,
            ),
          onSuccess: (result) => {
            if (result) {
              onSuccess(result.value, requestContext);
            }
          },
        },
      );
    },
    [getWalletForContext, openWalletModal, walletContext],
  );

  const handleStatusChange = useCallback(
    async (memory: MemoryItem, status: MemoryStatus) => {
      const memoryId = memory.id;

      await runMemoryMutation(
        `status:${memoryId}`,
        "Unable to update memory.",
        (wallet) => setMemoryStatus(wallet, memoryId, status),
        (updated, requestContext) => {
          memoryContextRef.current = requestContext;
          setMemoryContext(requestContext);
          setMemories((current) =>
            current.map((item) => (item.id === updated.id ? updated : item)),
          );
          setBackendStats(null);
          toast.success(
            status === "active" ? "Memory enabled" : "Memory disabled",
          );
        },
      );
    },
    [runMemoryMutation],
  );

  const handleStatusChangeMany = useCallback(
    async (memoryIds: string[], status: MemoryStatus) => {
      if (!memoryIds.length) {
        return;
      }

      const requestedIds = [...memoryIds];

      await runMemoryMutation(
        "bulk-status",
        "Unable to update memories.",
        (wallet) => setManyMemoryStatuses(wallet, requestedIds, status),
        (updated, requestContext) => {
          const updatedById = new Map(
            updated.map((memory) => [memory.id, memory]),
          );

          memoryContextRef.current = requestContext;
          setMemoryContext(requestContext);
          setMemories((current) =>
            current.map((memory) => updatedById.get(memory.id) ?? memory),
          );
          setBackendStats(null);
          toast.success("Selected memories updated");
        },
      );
    },
    [runMemoryMutation],
  );

  const handleDelete = useCallback(
    async (memory: MemoryItem) => {
      const memoryId = memory.id;

      await runMemoryMutation(
        `delete:${memoryId}`,
        "Unable to delete memory.",
        (wallet) => deleteMemoryRecord(wallet, memoryId),
        (deletedIds, requestContext) => {
          const deletedSet = new Set(deletedIds);

          memoryContextRef.current = requestContext;
          setMemoryContext(requestContext);
          setMemories((current) =>
            current.filter((item) => !deletedSet.has(item.id)),
          );
          setBackendStats(null);
          toast.success("Memory deleted");
        },
      );
    },
    [runMemoryMutation],
  );

  const handleDeleteMany = useCallback(
    async (memoryIds: string[]) => {
      if (!memoryIds.length) {
        return;
      }

      const requestedIds = [...memoryIds];

      await runMemoryMutation(
        "bulk-delete",
        "Unable to delete memories.",
        (wallet) => deleteManyMemoryRecords(wallet, requestedIds),
        (deletedIds, requestContext) => {
          const deletedSet = new Set(deletedIds);

          memoryContextRef.current = requestContext;
          setMemoryContext(requestContext);
          setMemories((current) =>
            current.filter((item) => !deletedSet.has(item.id)),
          );
          setBackendStats(null);
          toast.success("Selected memories deleted");
        },
      );
    },
    [runMemoryMutation],
  );

  const busy = Boolean(loading) || isSigning;

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">Memory</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Manage what Langclaw remembers, where each memory applies, and whether
            it can be reused in future conversations.
          </p>
        </div>

        <Button
          disabled={loading === "load"}
          onClick={() => void loadMemories()}
          variant="outline"
        >
          {loading === "load" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          Refresh
        </Button>
      </section>

      {!isConnected && (
        <Alert>
          <AlertCircle className="size-4" />
          <AlertTitle>Wallet required</AlertTitle>
          <AlertDescription>
            Choose a wallet to load and manage saved memories.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Something needs attention</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;

          return (
            <Card key={stat.label} size="sm">
              <CardHeader className="flex flex-row items-center justify-between gap-3">
                <div>
                  <CardTitle>{stat.label}</CardTitle>
                  <CardDescription>{stat.description}</CardDescription>
                </div>
                <Icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">{stat.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <MemoryDataTable
        key={walletContext || "disconnected"}
        data={memories}
        disabled={!isConnected || busy}
        onDelete={handleDelete}
        onDeleteMany={handleDeleteMany}
        onStatusChange={handleStatusChange}
        onStatusChangeMany={handleStatusChangeMany}
      />
    </div>
  );
}

function buildMemoryStats(memories: MemoryItem[]): MemoryStats {
  return {
    active: memories.filter((memory) => memory.status === "active").length,
    disabled: memories.filter((memory) => memory.status === "disabled").length,
    projectScoped: memories.filter((memory) => memory.scope !== "Global").length,
    total: memories.length,
  };
}

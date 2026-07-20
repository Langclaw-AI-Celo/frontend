import {
  LangclawApiError,
  isBoundedResponseInteger,
  isBoundedResponseNumber,
  isFutureResponseTimestamp,
  isNonEmptyResponseString,
  isNonNegativeResponseInteger,
  isOptionalResponseString,
  isOptionalResponseTimestamp,
  isOptionalResponseTimestampAtOrAfter,
  isPositiveResponseInteger,
  isResponseObject,
  isValidResponseTimestamp,
  postJson,
  readJsonResponse,
} from "./core.ts";

import type {
  AutomationDashboard,
  AutomationInAppNotification,
  AutomationRun,
  AutomationRunStatus,
  AutomationSettings,
  AutomationSettingsInput,
  AutomationStats,
  AutomationTask,
  AutomationTaskInput,
  AutomationTaskStatus,
  WalletAuth,
} from "./types.ts";

type AutomationResponse<T> = T & {
  code?: string;
  configured?: boolean;
  error?: string;
};

export async function getAutomationDashboard(wallet: WalletAuth) {
  const response = await postJson("/api/automation/tasks", {
    action: "list",
    wallet,
  });
  const payload = await readAutomationResponse<AutomationDashboard>(response);

  return requireAutomationDashboard(payload);
}

function requireAutomationDashboard(value: unknown) {
  if (!isAutomationDashboard(value)) {
    throw invalidAutomationResponse();
  }

  return value;
}

function isAutomationDashboard(value: unknown): value is AutomationDashboard {
  if (!isResponseObject(value)) {
    return false;
  }

  return (
    value.configured === true &&
    Array.isArray(value.notifications) &&
    value.notifications.every(isAutomationNotification) &&
    Array.isArray(value.tasks) &&
    value.tasks.every(isAutomationTask) &&
    Array.isArray(value.recentRuns) &&
    value.recentRuns.every(isAutomationRun) &&
    isAutomationSettings(value.settings) &&
    isAutomationStats(value.stats)
  );
}

function isAutomationScheduleTime(value: unknown): value is string {
  return (
    typeof value === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)
  );
}

function hasValidAutomationTaskDisplayStatus(
  status: unknown,
  displayStatus: unknown,
) {
  if (status === "active") {
    return displayStatus === "Active" || displayStatus === "Running";
  }

  if (status === "paused") {
    return displayStatus === "Paused";
  }

  return (
    (status === "draft" || status === "archived") &&
    displayStatus === "Draft"
  );
}

function isAutomationTask(value: unknown): value is AutomationTask {
  if (!isResponseObject(value)) {
    return false;
  }

  const createdAt = value.createdAt;
  const lastRunAt = value.lastRunAt;
  const lastRunStatus = value.lastRunStatus;
  const updatedAt = value.updatedAt;

  return (
    isNonEmptyResponseString(value.id) &&
    isNonEmptyResponseString(value.name) &&
    isNonEmptyResponseString(value.project) &&
    isOptionalResponseString(value.prompt) &&
    isOptionalResponseString(value.model) &&
    ["schedule", "event", "webhook"].includes(String(value.triggerType)) &&
    (value.triggerType === "schedule"
      ? ["daily", "weekly", "monthly"].includes(
          String(value.scheduleFrequency),
        )
      : value.scheduleFrequency === undefined ||
        ["daily", "weekly", "monthly"].includes(
          String(value.scheduleFrequency),
        )) &&
    isAutomationScheduleTime(value.scheduleTime) &&
    (value.scheduleWeekday === undefined ||
      isBoundedResponseInteger(value.scheduleWeekday, 0, 6)) &&
    (value.scheduleMonthDay === undefined ||
      isBoundedResponseInteger(value.scheduleMonthDay, 1, 31)) &&
    isNonEmptyResponseString(value.timezone) &&
    isOptionalResponseString(value.eventName) &&
    isOptionalResponseString(value.webhookSlug) &&
    (value.triggerType !== "event" ||
      isNonEmptyResponseString(value.eventName)) &&
    (value.triggerType !== "webhook" ||
      isNonEmptyResponseString(value.webhookSlug)) &&
    ["draft", "active", "paused", "archived"].includes(
      String(value.status),
    ) &&
    hasValidAutomationTaskDisplayStatus(value.status, value.displayStatus) &&
    isNonEmptyResponseString(value.triggerLabel) &&
    isValidResponseTimestamp(createdAt) &&
    isValidResponseTimestamp(updatedAt) &&
    Date.parse(updatedAt) >= Date.parse(createdAt) &&
    ((lastRunAt === undefined && lastRunStatus === undefined) ||
      (isValidResponseTimestamp(lastRunAt) &&
        isAutomationRunStatus(lastRunStatus) &&
        Date.parse(lastRunAt) >= Date.parse(createdAt))) &&
    isOptionalResponseTimestampAtOrAfter(value.nextRunAt, createdAt) &&
    isNonNegativeResponseInteger(value.consecutiveFailures) &&
    isNonNegativeResponseInteger(value.maxRetries) &&
    isPositiveResponseInteger(value.failureThreshold)
  );
}

function hasValidAutomationRunLifecycle(value: Record<string, unknown>) {
  if (value.status === "queued") {
    return (
      value.startedAt === undefined &&
      value.completedAt === undefined &&
      value.durationMs === undefined
    );
  }

  if (value.status === "running") {
    return (
      isValidResponseTimestamp(value.startedAt) &&
      value.completedAt === undefined &&
      value.durationMs === undefined
    );
  }

  if (value.status === "canceled") {
    return (
      isValidResponseTimestamp(value.completedAt) &&
      ((value.startedAt === undefined && value.durationMs === undefined) ||
        (isValidResponseTimestamp(value.startedAt) &&
          isNonNegativeResponseInteger(value.durationMs)))
    );
  }

  return (
    isValidResponseTimestamp(value.startedAt) &&
    isValidResponseTimestamp(value.completedAt) &&
    isNonNegativeResponseInteger(value.durationMs)
  );
}

function hasMatchingAutomationRunDuration(value: Record<string, unknown>) {
  if (value.durationMs === undefined) {
    return true;
  }

  return (
    isValidResponseTimestamp(value.startedAt) &&
    isValidResponseTimestamp(value.completedAt) &&
    isNonNegativeResponseInteger(value.durationMs) &&
    value.durationMs === Date.parse(value.completedAt) - Date.parse(value.startedAt)
  );
}

function isAutomationRun(value: unknown): value is AutomationRun {
  if (!isResponseObject(value)) {
    return false;
  }

  const createdAt = value.createdAt;
  const startedAt = value.startedAt;

  return (
    isNonEmptyResponseString(value.id) &&
    isNonEmptyResponseString(value.taskId) &&
    isOptionalResponseString(value.taskName) &&
    isAutomationRunStatus(value.status) &&
    ["schedule", "event", "webhook", "manual", "system"].includes(
      String(value.triggeredBy),
    ) &&
    isPositiveResponseInteger(value.attempt) &&
    isOptionalResponseTimestamp(value.scheduledFor) &&
    isValidResponseTimestamp(createdAt) &&
    isOptionalResponseTimestampAtOrAfter(startedAt, createdAt) &&
    isOptionalResponseTimestampAtOrAfter(
      value.completedAt,
      typeof startedAt === "string" ? startedAt : createdAt,
    ) &&
    hasValidAutomationRunLifecycle(value) &&
    hasMatchingAutomationRunDuration(value) &&
    (value.durationMs === undefined ||
      isNonNegativeResponseInteger(value.durationMs)) &&
    isOptionalResponseString(value.error)
  );
}

function isAutomationRunStatus(value: unknown): value is AutomationRunStatus {
  return [
    "queued",
    "running",
    "completed",
    "failed",
    "skipped",
    "canceled",
  ].includes(String(value));
}

function isAutomationNotification(
  value: unknown,
): value is AutomationInAppNotification {
  if (!isResponseObject(value)) {
    return false;
  }

  const createdAt = value.createdAt;

  return (
    isNonEmptyResponseString(value.id) &&
    isNonEmptyResponseString(value.title) &&
    isNonEmptyResponseString(value.body) &&
    (value.status === "unread" || value.status === "read") &&
    isOptionalResponseString(value.taskId) &&
    isOptionalResponseString(value.runId) &&
    isValidResponseTimestamp(createdAt) &&
    ((value.status === "unread" && value.readAt === undefined) ||
      (value.status === "read" && isValidResponseTimestamp(value.readAt))) &&
    isOptionalResponseTimestampAtOrAfter(value.readAt, createdAt)
  );
}

function isAutomation0GAmount(value: unknown): value is string {
  return typeof value === "string" && /^\d+(?:\.\d{1,18})?$/.test(value);
}

function isAutomationSettings(value: unknown): value is AutomationSettings {
  if (!isResponseObject(value)) {
    return false;
  }

  const notificationChannels = value.notificationChannels;

  return (
    ["none", "3-attempts", "5-attempts"].includes(
      String(value.retryPolicy),
    ) &&
    ["email", "in-app", "none"].includes(
      String(value.failureNotification),
    ) &&
    Array.isArray(notificationChannels) &&
    notificationChannels.every((channel) =>
      ["email", "telegram", "in-app"].includes(String(channel)),
    ) &&
    new Set(notificationChannels).size === notificationChannels.length &&
    isOptionalResponseString(value.notificationEmail) &&
    isOptionalResponseTimestamp(value.notificationEmailLinkedAt) &&
    isOptionalResponseString(value.notificationEmailPending) &&
    typeof value.notificationEmailVerified === "boolean" &&
    (!value.notificationEmailVerified ||
      (isNonEmptyResponseString(value.notificationEmail) &&
        isValidResponseTimestamp(value.notificationEmailLinkedAt) &&
        notificationChannels.includes("email"))) &&
    isOptionalResponseString(value.telegramChatId) &&
    isOptionalResponseTimestamp(value.telegramLinkedAt) &&
    isOptionalResponseString(value.telegramUsername) &&
    typeof value.telegramVerified === "boolean" &&
    (!value.telegramVerified ||
      (isNonEmptyResponseString(value.telegramChatId) &&
        isValidResponseTimestamp(value.telegramLinkedAt) &&
        notificationChannels.includes("telegram"))) &&
    typeof value.autoPauseRepeatedFailures === "boolean" &&
    typeof value.writeRunLogsToMemory === "boolean" &&
    isAutomation0GAmount(value.dailyLimit0G) &&
    isAutomation0GAmount(value.monthlyCap0G) &&
    ["pause", "alert", "allow"].includes(String(value.limitBehavior)) &&
    isAutomation0GAmount(value.lowBalanceThreshold0G) &&
    ["notify", "pause", "continue"].includes(String(value.thresholdAction))
  );
}

function isAutomationStats(value: unknown): value is AutomationStats {
  if (!isResponseObject(value)) {
    return false;
  }

  const nextRunAt = value.nextRunAt;
  const nextRunTaskName = value.nextRunTaskName;

  return (
    [
      value.activeTasks,
      value.scheduledTasks,
      value.eventTasks,
      value.runningNow,
      value.pendingRuns,
      value.completedThisWeek,
    ].every(isNonNegativeResponseInteger) &&
    isBoundedResponseNumber(value.successRate, 0, 100) &&
    ((nextRunAt === undefined && nextRunTaskName === undefined) ||
      (isValidResponseTimestamp(nextRunAt) &&
        isNonEmptyResponseString(nextRunTaskName)))
  );
}

function invalidAutomationResponse() {
  return new LangclawApiError("Backend returned invalid automation data.", 500);
}

export async function createAutomationTask(
  wallet: WalletAuth,
  task: AutomationTaskInput,
) {
  const response = await postJson("/api/automation/tasks", {
    action: "create",
    task,
    wallet,
  });
  const payload = await readAutomationResponse<{ task: AutomationTask }>(
    response,
  );

  return requireAutomationTask(payload.task);
}

export async function updateAutomationTask(
  wallet: WalletAuth,
  taskId: string,
  task: AutomationTaskInput,
) {
  const response = await postJson("/api/automation/tasks", {
    action: "update",
    task,
    taskId,
    wallet,
  });
  const payload = await readAutomationResponse<{ task: AutomationTask }>(
    response,
  );

  return requireAutomationTask(payload.task);
}

export async function setAutomationTaskStatus(
  wallet: WalletAuth,
  taskId: string,
  status: Extract<AutomationTaskStatus, "active" | "paused">,
) {
  const response = await postJson("/api/automation/tasks", {
    action: status === "active" ? "resume" : "pause",
    taskId,
    wallet,
  });
  const payload = await readAutomationResponse<{ task: AutomationTask }>(
    response,
  );

  return requireAutomationTask(payload.task);
}

export async function deleteAutomationTask(
  wallet: WalletAuth,
  taskId: string,
) {
  const response = await postJson("/api/automation/tasks", {
    action: "delete",
    taskId,
    wallet,
  });
  const payload = await readAutomationResponse<{ deleted?: boolean }>(response);

  return requireAutomationBoolean(payload.deleted);
}

export async function setAllAutomationTasksStatus(
  wallet: WalletAuth,
  status: Extract<AutomationTaskStatus, "active" | "paused">,
) {
  const response = await postJson("/api/automation/tasks", {
    action: status === "active" ? "resume-all" : "pause-all",
    wallet,
  });
  const payload = await readAutomationResponse<{ tasks: AutomationTask[] }>(
    response,
  );

  return requireAutomationTasks(payload.tasks);
}

function requireAutomationTask(value: unknown) {
  if (!isAutomationTask(value)) {
    throw invalidAutomationResponse();
  }

  return value;
}

function requireAutomationTasks(value: unknown) {
  if (!Array.isArray(value) || !value.every(isAutomationTask)) {
    throw invalidAutomationResponse();
  }

  return value;
}

function requireAutomationBoolean(value: unknown) {
  if (typeof value !== "boolean") {
    throw invalidAutomationResponse();
  }

  return value;
}

export async function runAutomationTask(wallet: WalletAuth, taskId: string) {
  const response = await postJson("/api/automation/runs", {
    action: "run",
    taskId,
    triggeredBy: "manual",
    wallet,
  });
  const payload = await readAutomationResponse<{ run: AutomationRun }>(
    response,
  );

  return requireAutomationRun(payload.run);
}

export async function listAutomationRuns(wallet: WalletAuth, taskId?: string) {
  const response = await postJson("/api/automation/runs", {
    action: "list",
    taskId,
    wallet,
  });
  const payload = await readAutomationResponse<{ runs: AutomationRun[] }>(
    response,
  );

  return requireAutomationRuns(payload.runs);
}

function requireAutomationRun(value: unknown) {
  if (!isAutomationRun(value)) {
    throw invalidAutomationResponse();
  }

  return value;
}

function requireAutomationRuns(value: unknown) {
  if (!Array.isArray(value) || !value.every(isAutomationRun)) {
    throw invalidAutomationResponse();
  }

  return value;
}

export async function getAutomationSettings(wallet: WalletAuth) {
  const response = await postJson("/api/automation/settings", {
    action: "get",
    wallet,
  });
  const payload = await readAutomationResponse<{
    settings: AutomationSettings;
  }>(response);

  return requireAutomationSettings(payload.settings);
}

export async function updateAutomationSettings(
  wallet: WalletAuth,
  settings: AutomationSettingsInput,
) {
  const response = await postJson("/api/automation/settings", {
    action: "update",
    settings,
    wallet,
  });
  const payload = await readAutomationResponse<{
    settings: AutomationSettings;
  }>(response);

  return requireAutomationSettings(payload.settings);
}

export async function listInAppAutomationNotifications(
  wallet: WalletAuth,
  limit = 20,
) {
  const response = await postJson("/api/automation/notifications", {
    action: "list-in-app",
    limit,
    wallet,
  });
  const payload = await readAutomationResponse<{
    notifications: AutomationInAppNotification[];
  }>(response);

  return requireAutomationNotifications(payload.notifications);
}

export async function markAutomationNotificationRead(
  wallet: WalletAuth,
  notificationId: string,
) {
  const response = await postJson("/api/automation/notifications", {
    action: "mark-in-app-read",
    notificationId,
    wallet,
  });
  const payload = await readAutomationResponse<{
    notification: AutomationInAppNotification;
  }>(response);

  return requireAutomationNotification(payload.notification);
}

export async function markAllAutomationNotificationsRead(wallet: WalletAuth) {
  const response = await postJson("/api/automation/notifications", {
    action: "mark-all-in-app-read",
    wallet,
  });
  const payload = await readAutomationResponse<{ read?: boolean }>(response);

  return requireAutomationBoolean(payload.read);
}

export async function requestAutomationEmailLink(
  wallet: WalletAuth,
  email: string,
) {
  const response = await postJson("/api/automation/notifications", {
    action: "request-email-link",
    email,
    wallet,
  });

  const payload = await readAutomationResponse<{
    link: { email: string; expiresAt: string; sent: boolean };
  }>(response);

  if (
    !isResponseObject(payload.link) ||
    !isNonEmptyResponseString(payload.link.email) ||
    !isFutureResponseTimestamp(payload.link.expiresAt) ||
    typeof payload.link.sent !== "boolean"
  ) {
    throw invalidAutomationResponse();
  }

  return payload;
}

export async function verifyAutomationEmailLink(
  wallet: WalletAuth,
  code: string,
) {
  const response = await postJson("/api/automation/notifications", {
    action: "verify-email-link",
    code,
    wallet,
  });
  const payload = await readAutomationResponse<{
    settings: AutomationSettings;
  }>(response);

  return requireAutomationSettings(payload.settings);
}

export async function unlinkAutomationEmail(wallet: WalletAuth) {
  const response = await postJson("/api/automation/notifications", {
    action: "unlink-email",
    wallet,
  });
  const payload = await readAutomationResponse<{
    settings: AutomationSettings;
  }>(response);

  return requireAutomationSettings(payload.settings);
}

export async function createAutomationTelegramLink(wallet: WalletAuth) {
  const response = await postJson("/api/automation/notifications", {
    action: "create-telegram-link",
    wallet,
  });
  const payload = await readAutomationResponse<{
    link: {
      botUsername: string;
      code: string;
      command: string;
      deepLink: string;
      expiresAt: string;
    };
  }>(response);

  return requireAutomationTelegramLink(payload.link);
}

export async function pollAutomationTelegramLink(wallet: WalletAuth) {
  const response = await postJson("/api/automation/notifications", {
    action: "poll-telegram-link",
    wallet,
  });

  const payload = await readAutomationResponse<{
    linked: boolean;
    settings?: AutomationSettings;
    status: string;
  }>(response);

  const isLinked =
    payload.linked === true &&
    payload.status === "linked" &&
    isAutomationSettings(payload.settings);
  const isPending =
    payload.linked === false &&
    payload.status === "pending" &&
    payload.settings === undefined;

  if (!isLinked && !isPending) {
    throw invalidAutomationResponse();
  }

  return payload;
}

export async function unlinkAutomationTelegram(wallet: WalletAuth) {
  const response = await postJson("/api/automation/notifications", {
    action: "unlink-telegram",
    wallet,
  });
  const payload = await readAutomationResponse<{
    settings: AutomationSettings;
  }>(response);

  return requireAutomationSettings(payload.settings);
}

function requireAutomationSettings(value: unknown) {
  if (!isAutomationSettings(value)) {
    throw invalidAutomationResponse();
  }

  return value;
}

function requireAutomationNotifications(value: unknown) {
  if (!Array.isArray(value) || !value.every(isAutomationNotification)) {
    throw invalidAutomationResponse();
  }

  return value;
}

function requireAutomationNotification(value: unknown) {
  if (!isAutomationNotification(value)) {
    throw invalidAutomationResponse();
  }

  return value;
}

function requireAutomationTelegramLink(value: unknown) {
  if (!isResponseObject(value)) {
    throw invalidAutomationResponse();
  }

  const botUsername = value.botUsername;
  const code = value.code;
  const command = value.command;
  const deepLink = value.deepLink;

  if (
    typeof botUsername !== "string" ||
    !/^[A-Za-z0-9_]{5,32}$/.test(botUsername) ||
    typeof code !== "string" ||
    !/^[A-Za-z0-9]{4,32}$/.test(code) ||
    command !== `/link ${code}` ||
    deepLink !==
      `https://t.me/${botUsername}?start=${encodeURIComponent(code)}` ||
    !isFutureResponseTimestamp(value.expiresAt)
  ) {
    throw invalidAutomationResponse();
  }

  return value as {
    botUsername: string;
    code: string;
    command: string;
    deepLink: string;
    expiresAt: string;
  };
}

async function readAutomationResponse<T>(response: Response) {
  const payload = await readJsonResponse<AutomationResponse<T>>(response);

  if (payload.error) {
    throw new LangclawApiError(payload.error, response.status);
  }

  return payload as T;
}

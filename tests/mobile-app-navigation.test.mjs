import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const layoutPath = path.resolve(testDir, "../app/(user)/layout.tsx");
const mobileNavPath = path.resolve(
  testDir,
  "../components/mobile-app-nav.tsx",
);

test("regular user routes mount the mobile app navigation", () => {
  const source = readFileSync(layoutPath, "utf8");

  assert.ok(
    source.includes(
      'import { MobileAppNav } from "@/components/mobile-app-nav";',
    ),
    "Expected the user layout to import MobileAppNav.",
  );
  assert.ok(
    source.includes("{isChatSession ? null : <MobileAppNav />}"),
    "Expected regular user routes to render MobileAppNav while active chat sessions omit it.",
  );
});

test("regular mobile pages reserve safe-area space without a duplicate top trigger", () => {
  const source = readFileSync(layoutPath, "utf8");
  const regularPageBranch = source.split(") : (")[1]?.split(")}")[0] ?? "";

  assert.ok(
    source.includes(
      "pb-[calc(6rem+env(safe-area-inset-bottom))]",
    ),
    "Expected regular pages to clear the standard and MiniPay mobile navigation heights.",
  );
  assert.ok(
    !regularPageBranch.includes("<SidebarTrigger"),
    "Expected the bottom Menu control to replace the regular-page top trigger.",
  );
  assert.ok(
    source.includes(
      '<SidebarTrigger className="absolute top-3 left-3 z-50',
    ),
    "Expected active chat sessions to retain their top sidebar trigger.",
  );
});

test("mobile navigation keeps primary shortcuts and route highlighting", () => {
  const source = readFileSync(mobileNavPath, "utf8");

  for (const [href, label] of [
    ["/chat", "Chat"],
    ["/usage", "Credits"],
    ["/watchlist", "Watch"],
    ["/task", "Tasks"],
  ]) {
    assert.ok(
      source.includes(`href: "${href}"`) && source.includes(`label: "${label}"`),
      `Expected the ${label} shortcut to point to ${href}.`,
    );
  }

  assert.ok(
    source.includes(
      "pathname === item.href || pathname.startsWith(`${item.href}/`)",
    ),
    "Expected nested routes to keep their primary shortcut active.",
  );
  assert.ok(
    source.includes('aria-current={isActive ? "page" : undefined}'),
    "Expected the active shortcut to expose its current-page state.",
  );
});

test("mobile navigation uses one menu event and explicit touch targets", () => {
  const source = readFileSync(mobileNavPath, "utf8");
  const touchTargetCount = source.match(/min-h-11/g)?.length ?? 0;

  assert.ok(
    source.includes("onClick={() => setOpenMobile(true)}"),
    "Expected Menu to open the mobile sidebar through its click event.",
  );
  assert.ok(
    !source.includes("onTouchEnd="),
    "Expected touch taps to rely on the click event instead of firing twice.",
  );
  assert.ok(
    touchTargetCount >= 2,
    "Expected Menu and shortcut controls to declare 44px minimum touch targets.",
  );
});

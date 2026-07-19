import assert from "node:assert/strict";
import test from "node:test";

import { splitSchemaPath } from "../lib/schema-path.ts";

test("schema paths keep markup as text while identifying parameters", () => {
  assert.deepEqual(splitSchemaPath('/users/<img src=x onerror=alert(1)>/{userId}'), [
    {
      isParameter: false,
      value: "/users/<img src=x onerror=alert(1)>/",
    },
    { isParameter: true, value: "{userId}" },
  ]);
});

test("schema paths preserve unmatched braces as plain text", () => {
  assert.deepEqual(splitSchemaPath("/runs/{runId"), [
    { isParameter: false, value: "/runs/{runId" },
  ]);
});

import test from "node:test";
import assert from "node:assert/strict";
import { preservePublishedAt } from "./article-utils.js";

test("keeps the original publication date when an already published article is saved again", () => {
  const original = new Date("2026-01-12T08:30:00.000Z");
  const editedAt = new Date("2026-11-09T09:00:00.000Z");
  assert.equal(preservePublishedAt(original, "published", editedAt), original);
});

import test from "node:test";
import assert from "node:assert/strict";
import { isNewsAdminUid, NEWS_ADMIN_UID } from "../../celupnews/admin";

test("the configured CELUPNEWS admin UID is the specified account", () => {
  assert.equal(NEWS_ADMIN_UID, "17MUSIoI22ZZUGed7gw6lIMDJuo2");
});

test("only the specified UID passes the CELUPNEWS admin check", () => {
  assert.equal(isNewsAdminUid("17MUSIoI22ZZUGed7gw6lIMDJuo2"), true);
  assert.equal(isNewsAdminUid("someone-else"), false);
  assert.equal(isNewsAdminUid(null), false);
});

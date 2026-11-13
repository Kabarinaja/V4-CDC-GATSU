export const NEWS_ADMIN_UID = "17MUSIoI22ZZUGed7gw6lIMDJuo2";
export function isNewsAdminUid(uid: unknown): uid is string {
  return typeof uid === "string" && uid === NEWS_ADMIN_UID;
}

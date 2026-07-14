import { AsyncLocalStorage } from "node:async_hooks";

const authStorage = new AsyncLocalStorage();

export const currentUserId = {
  toPostgres() {
    const userId = authStorage.getStore()?.userId;
    if (!userId) throw new Error("Authenticated user context is missing");
    return userId;
  },
};

export function requireAuth(req, res, next) {
  const userId = Number(req.session?.userId);

  if (!Number.isInteger(userId) || userId < 1) {
    return res.status(401).json({ message: "Authentication required" });
  }

  authStorage.run({ userId }, next);
}

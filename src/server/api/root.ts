import { router } from "./trpc";
import { storeRouter } from "./routers/store";

export const appRouter = router({
  store: storeRouter
});

export type AppRouter = typeof appRouter;

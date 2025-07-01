import { createTRPCRouter } from './trpc';
import { githubRouter } from './routers/github';
import { userRouter } from './routers/user';

export const appRouter = createTRPCRouter({
  github: githubRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;

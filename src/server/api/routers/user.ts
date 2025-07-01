import { createTRPCRouter, protectedProcedure } from '../trpc';
import { UserService } from '../service/user.service';

export const userRouter = createTRPCRouter({
  profile: protectedProcedure.query(async ({ ctx }) => {
    return UserService.getUserProfile(ctx, ctx.session.user.id);
  }),

  organizations: protectedProcedure.query(async ({ ctx }) => {
    return UserService.getUserOrganizations(ctx, ctx.session.user.id);
  }),
});

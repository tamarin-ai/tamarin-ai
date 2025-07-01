import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc';
import { GitHubService } from '../service/github.service';

const webhookSchema = z.object({
  payload: z.any(),
  signature: z.string(),
});

export const githubRouter = createTRPCRouter({
  repositories: protectedProcedure.query(async ({ ctx }) => {
    return GitHubService.getRepositories(ctx, ctx.session.user.id);
  }),

  organizationRepositories: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ input, ctx }) => {
      return GitHubService.getOrganizationRepositories(
        ctx,
        input.organizationId,
        ctx.session.user.id
      );
    }),

  toggleRepository: protectedProcedure
    .input(z.object({ repositoryId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return GitHubService.toggleRepository(
        ctx,
        input.repositoryId,
        ctx.session.user.id
      );
    }),

  repositoryStats: protectedProcedure
    .input(z.object({ organizationId: z.string().optional() }))
    .query(async ({ input, ctx }) => {
      return GitHubService.getRepositoryStats(
        ctx,
        ctx.session.user.id,
        input.organizationId
      );
    }),

  testInstallation: protectedProcedure
    .input(z.object({ installationId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      return GitHubService.testInstallation(
        ctx,
        input.installationId,
        ctx.session.user.name || 'test-user'
      );
    }),

  checkDatabase: protectedProcedure.query(async ({ ctx }) => {
    return GitHubService.getDatabaseInfo(ctx);
  }),

  webhook: publicProcedure
    .input(webhookSchema)
    .mutation(async ({ input, ctx }) => {
      return GitHubService.processWebhook(ctx, input.payload, input.signature);
    }),
});

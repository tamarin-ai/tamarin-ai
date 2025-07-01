import type { Session } from 'next-auth';
import { PrismaClient, Organization } from '../../../generated/prisma';
import { GitHubService as ExternalGitHubService } from '@/lib/github';
import { TRPCError } from '@trpc/server';

type Context = {
  session: Session | null;
  prisma: PrismaClient;
};

export class GitHubService {
  private static externalGitHubService = new ExternalGitHubService();

  static async verifyUserAccess(ctx: Context) {
    if (!ctx.session?.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Not authenticated',
      });
    }
    return ctx.session.user;
  }

  static async verifyOrganizationAccess(ctx: Context, organizationId: string) {
    const user = await this.verifyUserAccess(ctx);

    const membership = await ctx.prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId,
        },
      },
    });

    if (!membership) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Not authorized to access this organization',
      });
    }

    return membership;
  }

  static async verifyRepositoryAccess(ctx: Context, repositoryId: string) {
    const user = await this.verifyUserAccess(ctx);

    const repository = await ctx.prisma.repository.findFirst({
      where: {
        id: repositoryId,
        organization: {
          members: {
            some: {
              userId: user.id,
            },
          },
        },
      },
      include: {
        organization: true,
      },
    });

    if (!repository) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Not authorized to access this repository',
      });
    }

    return repository;
  }

  static async getRepositories(ctx: Context, userId: string) {
    await this.verifyUserAccess(ctx);

    return ctx.prisma.repository.findMany({
      where: {
        organization: {
          members: {
            some: {
              userId,
            },
          },
        },
      },
      include: {
        organization: {
          include: {
            members: {
              where: { userId },
              select: { role: true },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  static async getOrganizationRepositories(
    ctx: Context,
    organizationId: string,
    userId: string
  ) {
    await this.verifyOrganizationAccess(ctx, organizationId);

    const organization = await ctx.prisma.organization.findFirst({
      where: {
        id: organizationId,
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        repositories: {
          orderBy: { updatedAt: 'desc' },
        },
        _count: {
          select: {
            repositories: true,
            members: true,
          },
        },
      },
    });

    if (!organization) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Organization not found',
      });
    }

    return organization;
  }

  static async toggleRepository(
    ctx: Context,
    repositoryId: string,
    userId: string
  ) {
    const repository = await this.verifyRepositoryAccess(ctx, repositoryId);

    if (!repository.isEnabled && repository.private) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Private repositories require a paid plan',
      });
    }

    return ctx.prisma.repository.update({
      where: { id: repositoryId },
      data: { isEnabled: !repository.isEnabled },
    });
  }

  static async getRepositoryStats(
    ctx: Context,
    userId: string,
    organizationId?: string
  ) {
    await this.verifyUserAccess(ctx);
    if (organizationId) {
      await this.verifyOrganizationAccess(ctx, organizationId);
    }

    const whereClause = organizationId
      ? {
          organizationId,
          organization: {
            members: {
              some: { userId },
            },
          },
        }
      : {
          organization: {
            members: {
              some: { userId },
            },
          },
        };

    const [total, enabled, private_, publicRepos] =
      await ctx.prisma.$transaction([
        ctx.prisma.repository.count({ where: whereClause }),
        ctx.prisma.repository.count({
          where: { ...whereClause, isEnabled: true },
        }),
        ctx.prisma.repository.count({
          where: { ...whereClause, private: true },
        }),
        ctx.prisma.repository.count({
          where: { ...whereClause, private: false },
        }),
      ]);

    return {
      total,
      enabled,
      private: private_,
      public: publicRepos,
      disabled: total - enabled,
    };
  }

  static async testInstallation(
    ctx: Context,
    installationId: number,
    userName: string
  ) {
    await this.verifyUserAccess(ctx);

    const mockPayload = {
      action: 'created',
      installation: {
        id: installationId,
        account: {
          login: userName || 'test-user',
          html_url: 'https://github.com/test-user',
          avatar_url: 'https://github.com/test-user.png',
          bio: 'Test installation',
          type: 'User',
        },
      },
      repositories: [],
      sender: {
        login: userName || 'test-user',
      },
    };

    return this.externalGitHubService.handleInstallationCreated(mockPayload);
  }

  static async getDatabaseInfo(ctx: Context) {
    const user = await this.verifyUserAccess(ctx);

    const organizations = await ctx.prisma.organization.findMany({
      where: {
        members: {
          some: {
            userId: user.id,
          },
        },
      },
      include: {
        repositories: true,
        members: {
          include: {
            user: {
              select: { id: true, name: true, githubUsername: true },
            },
          },
        },
      },
    });

    const users = await ctx.prisma.user.findMany({
      select: { id: true, name: true, githubUsername: true, email: true },
    });

    return {
      organizations: organizations.map((org: Organization) => ({
        ...org,
        thirdPartyId: org.thirdPartyId.toString(),
      })),
      users,
      totalRepositories: await ctx.prisma.repository.count({
        where: {
          organization: {
            members: {
              some: {
                userId: user.id,
              },
            },
          },
        },
      }),
    };
  }

  static async processWebhook(ctx: Context, payload: any, signature: string) {
    return this.externalGitHubService.processWebhook(payload, signature);
  }
}

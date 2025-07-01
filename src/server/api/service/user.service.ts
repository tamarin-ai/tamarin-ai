import type { Session } from 'next-auth';
import {
  PrismaClient,
  Prisma,
  Organization,
  OrganizationMember,
} from '../../../generated/prisma';
import { TRPCError } from '@trpc/server';

type Context = {
  session: Session | null;
  prisma: PrismaClient;
};

type OrganizationWithCounts = Organization & {
  _count: {
    repositories: number;
    members: number;
  };
};

type OrganizationMemberWithOrg = OrganizationMember & {
  organization: OrganizationWithCounts;
};

export class UserService {
  static async verifyUserAccess(ctx: Context, userId: string) {
    if (!ctx.session?.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Not authenticated',
      });
    }
    if (ctx.session.user.id !== userId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Not authorized to access this user data',
      });
    }
  }

  static async verifyOrganizationAccess(ctx: Context, organizationId: string) {
    if (!ctx.session?.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Not authenticated',
      });
    }

    const membership = await ctx.prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: ctx.session.user.id,
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

  static async getUserProfile(ctx: Context, userId: string) {
    await this.verifyUserAccess(ctx, userId);

    return ctx.prisma.user.findUnique({
      where: { id: userId },
      include: {
        organizations: {
          include: {
            organization: {
              include: {
                _count: {
                  select: {
                    repositories: true,
                    members: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  static async getUserOrganizations(ctx: Context, userId: string) {
    await this.verifyUserAccess(ctx, userId);

    const organizations = await ctx.prisma.organizationMember.findMany({
      where: { userId },
      include: {
        organization: {
          include: {
            _count: {
              select: {
                repositories: true,
                members: true,
              },
            },
          },
        },
      },
      orderBy: {
        organization: {
          updatedAt: 'desc',
        },
      },
    });

    return organizations.map((member: OrganizationMemberWithOrg) => ({
      ...member.organization,
      userRole: member.role,
    }));
  }
}

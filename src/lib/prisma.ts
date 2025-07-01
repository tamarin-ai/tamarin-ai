import { PrismaClient, Prisma } from '../generated/prisma';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

// Add middleware for automatic updatedAt timestamps
prisma.$use(
  async (
    params: Prisma.MiddlewareParams,
    next: (params: Prisma.MiddlewareParams) => Promise<any>
  ) => {
    if (params.action === 'update' || params.action === 'updateMany') {
      if (params.args.data) {
        params.args.data.updatedAt = new Date();
      }
    }
    return next(params);
  }
);

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

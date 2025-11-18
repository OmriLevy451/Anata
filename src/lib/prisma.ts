
import { PrismaClient } from '@prisma/client';

// This setup prevents creating multiple Prisma Client instances in development
// due to Next.js hot reloading.

declare global {
  // We need to use `var` to declare a global variable that can be accessed across modules.
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prisma =
  global.prisma ||
  new PrismaClient({
    // Optionally log queries to the console in development
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;
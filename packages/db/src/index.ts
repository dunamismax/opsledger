import { PrismaClient } from './generated/client/index.js';

let prismaClient: PrismaClient | undefined;

export function getPrismaClient() {
  if (!prismaClient) {
    prismaClient = new PrismaClient();
  }

  return prismaClient;
}

export { PrismaClient };

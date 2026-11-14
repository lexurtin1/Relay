import { cookies } from "next/headers";
import { prisma } from "@relay/core";
import type { User } from "@prisma/client";
import { withDatabase } from "@/lib/db";
import { getDemoUser, listDemoFixtureUsers } from "@/lib/demo-data";

export const SESSION_COOKIE = "relay_user_id";

export async function getCurrentUser(): Promise<User | null> {
  const jar = await cookies();
  const userId = jar.get(SESSION_COOKIE)?.value;

  return withDatabase(
    async () => {
      if (userId) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user) return user;
      }
      return prisma.user.findFirst({
        where: { email: "maya.chen@example-calastone.invalid" },
      });
    },
    () => getDemoUser(userId),
  );
}

export async function listDemoUsers(): Promise<User[]> {
  return withDatabase(
    () => prisma.user.findMany({ orderBy: { name: "asc" } }),
    () => listDemoFixtureUsers(),
  );
}

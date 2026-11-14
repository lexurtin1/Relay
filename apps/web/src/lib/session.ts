import { cookies } from "next/headers";
import { prisma } from "@relay/core";
import type { User } from "@prisma/client";

export const SESSION_COOKIE = "relay_user_id";

export async function getCurrentUser(): Promise<User | null> {
  const jar = await cookies();
  const userId = jar.get(SESSION_COOKIE)?.value;
  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) return user;
  }
  return prisma.user.findFirst({
    where: { email: "maya.chen@example-calastone.invalid" },
  });
}

export async function listDemoUsers(): Promise<User[]> {
  return prisma.user.findMany({ orderBy: { name: "asc" } });
}

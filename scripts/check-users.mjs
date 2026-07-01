import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const users = await prisma.user.findMany({
  select: { id: true, username: true, email: true, role: true, passwordHash: true },
});
console.log("Users found:", users.length);
for (const u of users) {
  console.log({ id: u.id, username: u.username, email: u.email, role: u.role, hasPw: !!u.passwordHash });
}
await prisma.$disconnect();

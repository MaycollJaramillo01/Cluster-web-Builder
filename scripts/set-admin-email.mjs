import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const user = await prisma.user.update({
  where: { username: "Maycolljaramillo" },
  data: { email: "info@cluster.marketing" },
  select: { id: true, username: true, email: true, role: true },
});
console.log("Updated:", user);
await prisma.$disconnect();

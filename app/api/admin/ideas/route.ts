import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const ideas = await prisma.idea.findMany({
    where: { status: { not: "release" } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json({ ideas });
}

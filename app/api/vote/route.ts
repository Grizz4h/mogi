import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const id = body?.id as string | undefined;
  const dir = body?.dir as "yes" | "no" | undefined;

  if (!id || (dir !== "yes" && dir !== "no")) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const data =
    dir === "yes"
      ? { yesCount: { increment: 1 } }
      : { noCount: { increment: 1 } };

  const updated = await prisma.idea.update({
    where: { id },
    data,
    select: { id: true, yesCount: true, noCount: true },
  });

  return NextResponse.json(updated);
}

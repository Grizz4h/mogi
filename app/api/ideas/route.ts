export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const text = body?.text?.trim();
  if (!text || typeof text !== "string" || text.length < 3 || text.length > 120) {
    return NextResponse.json({ error: "Invalid text" }, { status: 400 });
  }
  // Generate a simple unique id (timestamp + random)
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const idea = await prisma.idea.create({
    data: {
      id,
      text,
      status: "pending", // Neue Ideen sind jetzt standardmäßig 'pending'
    },
    select: { id: true, text: true, yesCount: true, noCount: true },
  });
  return NextResponse.json(idea);
}
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import { SEED_IDEAS } from "../../../lib/seedIdeas";

async function ensureSeeded() {
  const count = await prisma.idea.count();
  if (count > 0) return;

  for (const i of SEED_IDEAS as readonly { id: string; text: string }[]) {
    await prisma.idea.upsert({
      where: { id: i.id },
      update: { text: i.text, status: "release" },
      create: { id: i.id, text: i.text, status: "release" },
    });
  }
}

export async function GET() {
  await ensureSeeded();

  const ideas = await prisma.idea.findMany({
    where: { status: "release" },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  interface Idea {
    id: string;
    text: string;
    yesCount: number;
    noCount: number;
  }

  interface IdeaResponse {
    id: string;
    text: string;
    yesCount: number;
    noCount: number;
  }

  return NextResponse.json({
    ideas: ideas.map((i: Idea): IdeaResponse => ({
      id: i.id,
      text: i.text,
      yesCount: i.yesCount,
      noCount: i.noCount,
    })),
  });
}
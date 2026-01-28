import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json();
  const { status, text } = body;

  const updateData: any = {};

  // Update status wenn vorhanden
  if (status && ["pending", "release"].includes(status)) {
    updateData.status = status;
  }

  // Update text wenn vorhanden und gültig
  if (text && typeof text === "string") {
    const trimmed = text.trim();
    if (trimmed.length >= 3 && trimmed.length <= 120) {
      updateData.text = trimmed;
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const idea = await prisma.idea.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ idea });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  await prisma.idea.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}

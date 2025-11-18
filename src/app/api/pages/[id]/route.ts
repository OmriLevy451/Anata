import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const page = await prisma.page.findUnique({
    where: { id: params.id },
    select: { id: true, boardId: true, name: true, width: true, height: true, content: true, version: true, updatedAt: true }
  });
  if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(page);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const page = await prisma.page.findUnique({ where: { id: params.id } });
  if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });
  
  await prisma.page.delete({ where: { id: params.id } });
  return NextResponse.json({ message: "Page deleted" }, { status: 200 });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const { name, width, height, content } = body;
  
  const page = await prisma.page.findUnique({ where: { id: params.id } });
  if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const updatedPage = await prisma.page.update({
    where: { id: params.id },
    data: {
      name: name ?? page.name,
      width: width ?? page.width,
      height: height ?? page.height,
      content: content ?? page.content,
      version: page.version + 1,
    },
    select: { id: true, boardId: true, name: true, width: true, height: true, content: true, version: true, updatedAt: true }
  });
  
  return NextResponse.json(updatedPage);
}

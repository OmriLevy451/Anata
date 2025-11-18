import {NextResponse} from "next/server";
import {prisma} from "@/lib/db";


export async function GET(_: Request, {params}: { params: { id: string }}) {
    const { id } = await params;
    const board = await prisma.board.findUnique({
        where: {id},
        select: {
            id: true,
            title: true,
            ownerId: true,
            createdAt: true,
            pageOrder: true,
        },
    });
    if (!board) {
        return NextResponse.json({error: "Board not found"}, {status: 404});
    }
    return NextResponse.json(board);
}

export async function DELETE(_: Request, {params}: { params: { id: string }}) {
    const { id } = await params;
    const board = await prisma.board.findUnique({where: {id}});
    if (!board) {
        return NextResponse.json({error: "Board not found"}, {status: 404});
    }
    await prisma.board.delete({where: {id}});
    return NextResponse.json({message: "Board deleted"}, {status: 200});
}

export async function PATCH(req: Request, {params}: { params: { id: string }}) {
    const { id } = await params;
    const body = await req.json();
    const { title, pageOrder } = body;

    const board = await prisma.board.findUnique({where: {id}});
    if (!board) {
        return NextResponse.json({error: "Board not found"}, {status: 404});
    }

    const updatedBoard = await prisma.board.update({
        where: {id},
        data: {
            title: title ?? board.title,
            pageOrder: pageOrder ?? board.pageOrder,
        },
        select: {
            id: true,
            title: true,
            ownerId: true,
            createdAt: true,
            pageOrder: true,
        },
    });

    return NextResponse.json(updatedBoard);
}


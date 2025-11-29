import BoardCanvas from "@/components/BoardCanvas";
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const board = await prisma.board.findUnique({
    where: { id },
    include: { pages: true }
  });

  if (!board) return <div className="p-8 font-bold text-xl">Board not found</div>;

  const firstPage = board.pages[0];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Bar */}
      <div className="bg-[#ffc26e] p-4 flex items-center justify-between border-b-2 border-black">
        <div>
          <Link href="/" className="text-black hover:underline font-bold text-sm mb-1 block">
            &larr; Back to Dashboard
          </Link>
          <h1 className="text-2xl font-black text-black">{board.title}</h1>
          <p className="text-gray-800 italic text-xs">Owner: {board.ownerId}</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-hidden flex flex-col bg-[#ffc26e]">
        {firstPage ? (
          <BoardCanvas pageId={firstPage.id} userId={board.ownerId} />
        ) : (
          <div className="p-10 bg-white border-2 border-dashed border-black rounded text-gray-500 italic">
            This board has no pages yet.
          </div>
        )}
      </div>
    </div>
  );
}
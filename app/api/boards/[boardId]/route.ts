import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(
  req: Request,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Tidak terotorisasi" }, { status: 401 })
    }

    const { boardId } = await params

    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        workspace: {
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, image: true },
                },
              },
            },
          },
        },
        columns: {
          orderBy: { order: "asc" },
          include: {
            tasks: {
              orderBy: { order: "asc" },
              include: {
                subTasks: {
                  orderBy: { createdAt: "asc" },
                },
                comments: true,
                assignee: {
                  select: { id: true, name: true, email: true, image: true },
                },
              },
            },
          },
        },
      },
    })

    if (!board) {
      return NextResponse.json({ message: "Papan tidak ditemukan" }, { status: 404 })
    }

    return NextResponse.json(board)
  } catch (error) {
    console.error("Error GET board detail:", error)
    return NextResponse.json({ message: "Gagal mengambil detail papan", error }, { status: 500 })
  }
}
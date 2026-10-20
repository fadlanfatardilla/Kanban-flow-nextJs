import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Tidak terotorisasi" }, { status: 401 })
    }

    const { taskId, destinationColumnId, newOrder } = await req.json()

    if (!taskId || !destinationColumnId) {
      return NextResponse.json({ message: "Data tidak lengkap" }, { status: 400 })
    }

    // 1. Ambil data user yang sedang login untuk pencatatan log
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!currentUser) {
      return NextResponse.json({ message: "User tidak ditemukan" }, { status: 404 })
    }

    // 2. Ambil task beserta informasi kolom tujuan, board, dan workspace-nya
    const targetColumn = await prisma.column.findUnique({
      where: { id: destinationColumnId },
      include: {
        board: true,
      },
    })

    if (!targetColumn) {
      return NextResponse.json({ message: "Kolom tujuan tidak ditemukan" }, { status: 404 })
    }

    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
    })

    if (!existingTask) {
      return NextResponse.json({ message: "Task tidak ditemukan" }, { status: 404 })
    }

    const isColumnChanged = existingTask.columnId !== destinationColumnId

    // 3. Update kolom dan urutan task di database
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        columnId: destinationColumnId,
        order: newOrder,
      },
    })

    // 4. Catat ke ActivityLog secara otomatis jika kartu dipindah ke kolom lain
    if (isColumnChanged && targetColumn.board?.workspaceId) {
      await prisma.activityLog.create({
        data: {
          action: "MOVE_TASK",
          details: `memindahkan tugas "${updatedTask.title}" ke kolom ${targetColumn.title}`,
          taskId: updatedTask.id,
          userId: currentUser.id,
          workspaceId: targetColumn.board.workspaceId,
        },
      })
    }

    return NextResponse.json(updatedTask, { status: 200 })
  } catch (error) {
    console.error("Error reordering task:", error)
    return NextResponse.json({ message: "Gagal memperbarui urutan task", error }, { status: 500 })
  }
}
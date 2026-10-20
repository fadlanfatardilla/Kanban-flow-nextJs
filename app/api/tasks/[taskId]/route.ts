import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// PUT: Edit task / Move task
export async function PUT(
  req: Request,
  context: { params: Promise<{ taskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Tidak terotorisasi" }, { status: 401 })
    }

    const { taskId } = await context.params
    const body = await req.json()
    const { title, description, priority, dueDate, assigneeId, columnId } = body

    if (!title) {
      return NextResponse.json({ message: "Judul tugas wajib diisi" }, { status: 400 })
    }

    // 1. Ambil data user yang sedang login untuk keperluan pencatatan log aktivitas
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!currentUser) {
      return NextResponse.json({ message: "User tidak ditemukan" }, { status: 404 })
    }

    // 2. Ambil task lama beserta kolom dan board-nya untuk mengecek perubahan kolom & workspaceId
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        column: {
          include: {
            board: true,
          },
        },
      },
    })

    if (!existingTask) {
      return NextResponse.json({ message: "Tugas tidak ditemukan" }, { status: 404 })
    }

    // Cek apakah ada perubahan kolom (drag-and-drop / pemindahan kartu)
    const isColumnChanged = columnId && columnId !== existingTask.columnId

    // 3. Update task
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        title,
        description,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        assigneeId: assigneeId || null,
        ...(columnId && { columnId }), // Update columnId jika dikirimkan dari frontend
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, image: true },
        },
        subTasks: true,
        comments: true,
        column: true,
      },
    })

    // 4. Catat aktivitas ke ActivityLog secara otomatis
    if (existingTask.column.board?.workspaceId) {
      const workspaceId = existingTask.column.board.workspaceId

      if (isColumnChanged) {
        // Jika kartu dipindahkan ke kolom lain
        await prisma.activityLog.create({
          data: {
            action: "MOVE_TASK",
            details: `memindahkan tugas "${updatedTask.title}" ke kolom ${updatedTask.column.title}`,
            taskId: updatedTask.id,
            userId: currentUser.id,
            workspaceId: workspaceId,
          },
        })
      } else {
        // Jika hanya memperbarui informasi tugas (edit biasa)
        await prisma.activityLog.create({
          data: {
            action: "UPDATE_TASK",
            details: `memperbarui informasi tugas "${updatedTask.title}"`,
            taskId: updatedTask.id,
            userId: currentUser.id,
            workspaceId: workspaceId,
          },
        })
      }
    }

    return NextResponse.json(updatedTask, { status: 200 })
  } catch (error: any) {
    console.error("Error PUT task:", error)
    return NextResponse.json(
      { message: "Gagal memperbarui tugas", error: error.message },
      { status: 500 }
    )
  }
}

// DELETE: Hapus task
export async function DELETE(
  req: Request,
  context: { params: Promise<{ taskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Tidak terotorisasi" }, { status: 401 })
    }

    const { taskId } = await context.params

    await prisma.task.delete({
      where: { id: taskId },
    })

    return NextResponse.json({ message: "Tugas berhasil dihapus" }, { status: 200 })
  } catch (error: any) {
    console.error("Error DELETE task:", error)
    return NextResponse.json(
      { message: "Gagal menghapus tugas", error: error.message },
      { status: 500 }
    )
  }
}
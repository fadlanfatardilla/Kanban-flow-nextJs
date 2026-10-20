import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ subtaskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Tidak terotorisasi" }, { status: 401 })
    }

    const { subtaskId } = await params
    const { isDone } = await req.json()

    const updatedSubTask = await prisma.subTask.update({
      where: { id: subtaskId },
      data: { isDone },
    })

    return NextResponse.json(updatedSubTask, { status: 200 })
  } catch (error: any) {
    console.error("Error Detail PUT subtask:", error)
    return NextResponse.json({ message: "Gagal mengupdate sub-task", error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ subtaskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Tidak terotorisasi" }, { status: 401 })
    }

    const { subtaskId } = await params

    await prisma.subTask.delete({
      where: { id: subtaskId },
    })

    return NextResponse.json({ message: "Sub-task berhasil dihapus" }, { status: 200 })
  } catch (error: any) {
    console.error("Error Detail DELETE subtask:", error)
    return NextResponse.json({ message: "Gagal menghapus sub-task", error: error.message }, { status: 500 })
  }
}
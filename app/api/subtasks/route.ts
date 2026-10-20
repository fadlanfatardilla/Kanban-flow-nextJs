import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Tidak terotorisasi" }, { status: 401 })
    }

    const { title, taskId } = await req.json()

    if (!title || !taskId) {
      return NextResponse.json({ message: "Judul sub-task dan taskId wajib diisi" }, { status: 400 })
    }

    const newSubTask = await prisma.subTask.create({
      data: {
        title,
        taskId,
      },
    })

    return NextResponse.json(newSubTask, { status: 201 })
  } catch (error: any) {
    console.error("Error POST subtask:", error)
    return NextResponse.json({ message: "Gagal membuat sub-task", error: error.message }, { status: 500 })
  }
}
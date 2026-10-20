import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(
  req: Request,
  context: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Tidak terotorisasi" }, { status: 401 })
    }

    const { workspaceId } = await context.params
    const body = await req.json()
    const { email, role = "MEMBER" } = body

    if (!email) {
      return NextResponse.json({ message: "Email wajib diisi" }, { status: 400 })
    }

    // Cari user yang akan diundang berdasarkan email
    const userToInvite = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    })

    if (!userToInvite) {
      return NextResponse.json(
        { message: "Pengguna dengan email tersebut belum terdaftar di aplikasi" },
        { status: 404 }
      )
    }

    // Cek apakah user sudah menjadi anggota di workspace ini
    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: userToInvite.id,
          workspaceId: workspaceId,
        },
      },
    })

    if (existingMember) {
      return NextResponse.json(
        { message: "Pengguna sudah menjadi anggota workspace ini" },
        { status: 400 }
      )
    }

    // Tambahkan pengguna ke WorkspaceMember
    const newMember = await prisma.workspaceMember.create({
      data: {
        userId: userToInvite.id,
        workspaceId: workspaceId,
        role: role,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    })

    return NextResponse.json(
      { message: "Anggota berhasil ditambahkan ke workspace", member: newMember },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Error POST workspace member:", error)
    return NextResponse.json(
      { message: "Gagal menambahkan anggota", error: error.message },
      { status: 500 }
    )
  }
}
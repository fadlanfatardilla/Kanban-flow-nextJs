import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// GET: Ambil semua workspace milik user
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Tidak terotorisasi" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        memberships: {
          include: {
            workspace: {
              include: {
                boards: true,
              },
            },
          },
        },
      },
    })

    const workspaces = user?.memberships.map((m) => m.workspace) || []
    return NextResponse.json(workspaces)
  } catch (error) {
    return NextResponse.json({ message: "Gagal mengambil workspace", error }, { status: 500 })
  }
}

// POST: Buat workspace baru
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Tidak terotorisasi" }, { status: 401 })
    }

    const { name, description } = await req.json()
    if (!name) {
      return NextResponse.json({ message: "Nama workspace wajib diisi" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ message: "User tidak ditemukan" }, { status: 404 })
    }

    // Generate slug unik berdasarkan nama workspace & timestamp
    const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now()

    const workspace = await prisma.workspace.create({
      data: {
        name,
        slug,
        description,
        members: {
          create: {
            userId: user.id,
            role: "OWNER",
          },
        },
      },
      include: {
        boards: true,
      },
    })

    return NextResponse.json(workspace, { status: 201 })
  } catch (error) {
    console.error("Error POST workspace:", error)
    return NextResponse.json({ message: "Gagal membuat workspace", error }, { status: 500 })
  }
}
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId } = await params;

    // Ambil daftar aktivitas terbaru di workspace ini (maksimal 20 data terakhir)
    const activities = await prisma.activityLog.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
        task: {
          select: {
            title: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json(activities, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching activities:", error);
    return NextResponse.json(
      { message: "Gagal mengambil riwayat aktivitas.", error: error.message },
      { status: 500 }
    );
  }
}
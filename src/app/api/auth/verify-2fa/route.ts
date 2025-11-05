import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import otplib from "otplib"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || !user.twoFactorSecret) {
      return NextResponse.json({ error: "2FA not set up" }, { status: 400 })
    }

    // Verify token
    const isValid = otplib.authenticator.check(token, user.twoFactorSecret)

    if (!isValid) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 })
    }

    // Mark 2FA as verified for this session
    await db.user.update({
      where: { id: session.user.id },
      data: {
        is2FAVerified: true,
      }
    })

    return NextResponse.json({
      message: "2FA verified successfully",
      verified: true
    })

  } catch (error: any) {
    console.error("2FA verification error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
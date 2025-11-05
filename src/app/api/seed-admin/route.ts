import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"

export async function POST() {
  try {
    // Check if admin user already exists
    const existingAdmin = await db.user.findFirst({
      where: { email: "admin@example.com" }
    })

    if (existingAdmin) {
      return NextResponse.json({ 
        message: "Admin user already exists",
        user: {
          id: existingAdmin.id,
          email: existingAdmin.email,
          isAdmin: existingAdmin.isAdmin
        }
      })
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash("admin123", 10)
    
    const admin = await db.user.create({
      data: {
        email: "admin@example.com",
        password: hashedPassword,
        name: "Admin User",
        isAdmin: true,
        has2FA: false,
        is2FAVerified: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        has2FA: true,
        is2FAVerified: true,
        createdAt: true,
      }
    })

    return NextResponse.json({ 
      message: "Admin user created successfully",
      user: admin
    })

  } catch (error: any) {
    console.error("Seed admin error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
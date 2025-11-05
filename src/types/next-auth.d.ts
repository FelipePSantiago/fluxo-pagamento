import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      isAdmin: boolean
      has2FA: boolean
      is2FAVerified: boolean
    } & DefaultSession["user"]
  }

  interface User {
    isAdmin: boolean
    has2FA: boolean
    is2FAVerified: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    isAdmin: boolean
    has2FA: boolean
    is2FAVerified: boolean
  }
}
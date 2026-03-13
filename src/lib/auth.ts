import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

/**
 * Allowed admin emails for Google OAuth sign-in.
 * Only these emails can create accounts / log in.
 * Set ALLOWED_ADMIN_EMAILS env var as comma-separated list,
 * or it defaults to Diego's email.
 */
function getAllowedEmails(): string[] {
  const env = process.env.ALLOWED_ADMIN_EMAILS;
  if (env) return env.split(",").map((e) => e.trim().toLowerCase());
  return ["diego@ddg.solutions"];
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = (credentials.email as string).toLowerCase().trim();
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({
          where: { email },
        });
        if (!user || !user.password) return null;

        // Support both bcrypt hashed and legacy plaintext passwords
        let valid = false;
        if (user.password.startsWith("$2")) {
          // bcrypt hash
          valid = await bcrypt.compare(password, user.password);
        } else {
          // Legacy plaintext — migrate to bcrypt on successful login
          valid = user.password === password;
          if (valid) {
            const hashed = await bcrypt.hash(password, 12);
            await prisma.user.update({
              where: { id: user.id },
              data: { password: hashed },
            });
          }
        }

        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account }) {
      // Block Google OAuth for non-allowed emails (no random signups)
      if (account?.provider === "google") {
        const email = user.email?.toLowerCase().trim();
        if (!email || !getAllowedEmails().includes(email)) {
          return false; // Denied — not an authorized admin
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      if (account?.provider === "google") {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});

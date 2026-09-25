import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db/mongoose";
import { User } from "@/models";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    ...(process.env.GITHUB_ID && process.env.GITHUB_SECRET
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_ID,
            clientSecret: process.env.GITHUB_SECRET,
          }),
        ]
      : []),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid email or password");
        }

        await connectDB();
        const user = await User.findOne({
          email: credentials.email.toLowerCase().trim(),
          isDeleted: false,
        }).select("+passwordHash");

        if (!user || !user.passwordHash) {
          throw new Error("No account found with this email");
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) {
          throw new Error("Incorrect password");
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          defaultCurrency: user.defaultCurrency || "INR",
          avatarUrl: user.avatarUrl || "",
          onboardingCompleted: user.onboardingCompleted ?? false,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.defaultCurrency = (user as unknown as { defaultCurrency?: string }).defaultCurrency || "INR";
        token.avatarUrl = (user as unknown as { avatarUrl?: string }).avatarUrl || "";
        token.onboardingCompleted = (user as unknown as { onboardingCompleted?: boolean }).onboardingCompleted ?? false;
      }
      if (trigger === "update" && session) {
        if (session.name) token.name = session.name;
        if (session.defaultCurrency) token.defaultCurrency = session.defaultCurrency;
        if (session.avatarUrl !== undefined) token.avatarUrl = session.avatarUrl;
        if (session.onboardingCompleted !== undefined) token.onboardingCompleted = session.onboardingCompleted;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.defaultCurrency = (token.defaultCurrency as string) || "INR";
        session.user.avatarUrl = (token.avatarUrl as string) || "";
        session.user.onboardingCompleted = (token.onboardingCompleted as boolean) ?? false;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "delhi_expense_management_super_secret_jwt_key_2026_production_grade_random_seed_987654321",
};

export default authOptions;

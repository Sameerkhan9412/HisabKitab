import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      avatarUrl?: string;
      defaultCurrency: string;
      onboardingCompleted: boolean;
    };
  }

  interface User {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    defaultCurrency: string;
    onboardingCompleted: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    defaultCurrency?: string;
    avatarUrl?: string;
    onboardingCompleted?: boolean;
  }
}

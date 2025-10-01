import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'database' as const },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  pages: {},
  callbacks: {
    async session({ session, user }: any) {
      if (session?.user) {
        (session.user as any).id = user.id;
        (session.user as any).isAdmin = Boolean((user as any).isAdmin);
      }
      return session;
    },
  },
  events: {
    async createUser({ user }: any) {
      // Apply env-driven defaults when a user is created via OAuth
      const defaultAdActiveDays = Number(process.env.AD_ACTIVE_DAYS || 3);
      const defaultMaxActiveAds = Number(process.env.MAX_ACTIVE_ADS_PER_USER || 1);
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { adActiveDays: defaultAdActiveDays, maxActiveAds: defaultMaxActiveAds },
        });
      } catch (_) {
        // Ignore if user not found or update fails; DB defaults still apply
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  debug: process.env.NODE_ENV !== 'production',
};



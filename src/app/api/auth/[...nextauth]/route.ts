import NextAuth from 'next-auth';
import { authOptions } from '@/app/api/auth/options';

const handler = NextAuth(authOptions as any);
export { handler as GET, handler as POST };



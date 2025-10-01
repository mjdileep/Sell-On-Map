"use client";
import { SessionProvider } from 'next-auth/react';
import { Menu, Home, User, LogOut, List, Loader2, MapPinned } from 'lucide-react';
import { createContext, useContext, useEffect, useState } from 'react';
import Drawer from '@/components/Drawer';
import Link from 'next/link';
import { signIn, signOut, useSession } from 'next-auth/react';
import { ConfigProvider, useConfig } from './config-context';
import { logEvent, logPageView } from '@/lib/analytics';
import Modal from '@/components/Modal';
import Image from 'next/image';

const GoogleIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ConfigProvider>
        <Shell>{children}</Shell>
      </ConfigProvider>
    </SessionProvider>
  );
}

type OpenAuthModalOptions = { reason?: string; callbackUrl?: string };
const AuthModalContext = createContext<{ openAuthModal: (opts?: OpenAuthModalOptions) => void } | null>(null);
export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error('useAuthModal must be used within Providers');
  return ctx;
}

function Shell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authReason, setAuthReason] = useState<string | undefined>(undefined);
  const [authCallbackUrl, setAuthCallbackUrl] = useState<string | undefined>(undefined);
  const { data: session, status } = useSession();
  const user = session?.user as any;
  const { country } = useConfig();

  useEffect(() => {
    // Fire a pageview on initial load and on visibility changes back to visible
    try {
      const path = typeof location !== 'undefined' ? location.pathname + location.search : '/';
      logPageView({ path, country, hostname: typeof location !== 'undefined' ? location.hostname : undefined });
    } catch {}
  }, [country]);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    try {
      const cb = authCallbackUrl || '/';
      // Log intent to login before redirect
      try { await logEvent({ eventType: 'login_click', path: typeof location !== 'undefined' ? location.pathname : '/', country }); } catch {}
      await signIn('google', { callbackUrl: cb });
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      // Keep loading state for a minimum of 2 seconds for visual feedback
      setTimeout(() => {
        setIsSigningIn(false);
      }, 3000);
    }
  };

  const openAuthModal = (opts?: OpenAuthModalOptions) => {
    setAuthReason(opts?.reason);
    setAuthCallbackUrl(opts?.callbackUrl);
    setAuthModalOpen(true);
  };

  return (
    <AuthModalContext.Provider value={{ openAuthModal }}>
      <div className="min-h-screen">
        <button
          aria-label="Open SellOnMap menu"
          onClick={() => setOpen(true)}
          className="fixed top-4 left-2 sm:left-3 md:left-4 z-[1100] py-1 rounded-lg bg-white/95 border border-gray-200 shadow-md hover:bg-white hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
        >
          <Image 
            src="/sellonmap-logo.svg" 
            alt="SellOnMap" 
            width={48} 
            height={16} 
            className="flex-shrink-0 ml-[-8px]"
          />
          <Menu className="h-4 w-4 ml-[-20px] mt-[8px] text-blue-600" />
        </button>
        <Drawer open={open} onClose={() => setOpen(false)}>
          <div className="p-4 space-y-4">

            {/* Main Navigation */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 mb-3">Navigation</h3>
              <Link 
                href="/" 
                onClick={() => setOpen(false)} 
                className="flex items-center space-x-3 w-full px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-emerald-50 transition-all duration-200 text-gray-700 hover:text-gray-900 border border-transparent hover:border-blue-100"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r from-blue-100 to-emerald-100">
                  <Image 
                    src="/sellonmap-logo.svg" 
                    alt="All Ads" 
                    width={32} 
                    height={12} 
                    className="flex-shrink-0"
                  />
                </div>
                <span className="font-medium">Home - All Ads</span>
              </Link>
            </div>
            
            {/* Account Section */}
            <div className="border-t border-gray-200 pt-4">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 mb-3">Account</div>
              {status === 'authenticated' ? (
                <div className="space-y-3">
                  {/* User Info */}
                  <div className="flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-xl border border-blue-100">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center shadow-md">
                        <User className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">
                        {user?.name || 'User'}
                      </div>
                      <div className="text-xs text-gray-600 truncate">
                        {user?.email}
                      </div>
                    </div>
                  </div>
                  
                  {/* User Actions */}
                  <div className="space-y-2">
                    <Link 
                      href="/me/listings" 
                      className="flex items-center space-x-3 w-full px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-emerald-50 transition-all duration-200 text-gray-700 hover:text-gray-900 border border-transparent hover:border-blue-100" 
                      onClick={() => setOpen(false)}
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r from-emerald-100 to-blue-100">
                        <List className="h-4 w-4 text-emerald-600" />
                      </div>
                      <span className="font-medium">My Listings</span>
                    </Link>
                    {user?.isAdmin ? (
                      <Link 
                        href="/admin/moderation" 
                        className="flex items-center space-x-3 w-full px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 transition-all duration-200 text-gray-700 hover:text-gray-900 border border-transparent hover:border-orange-100" 
                        onClick={() => setOpen(false)}
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r from-orange-100 to-red-100">
                          <MapPinned className="h-4 w-4 text-orange-600" />
                        </div>
                        <span className="font-medium">Admin Moderation</span>
                      </Link>
                    ) : null}
                    {user?.isAdmin ? (
                      <Link 
                        href="/admin/analytics" 
                        className="flex items-center space-x-3 w-full px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 transition-all duration-200 text-gray-700 hover:text-gray-900 border border-transparent hover:border-indigo-100" 
                        onClick={() => setOpen(false)}
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r from-indigo-100 to-blue-100">
                          <span className="text-indigo-600 text-sm font-semibold">A</span>
                        </div>
                        <span className="font-medium">Admin Analytics</span>
                      </Link>
                    ) : null}
                    {user?.isAdmin ? (
                      <Link 
                        href="/admin/ads" 
                        className="flex items-center space-x-3 w-full px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-200 text-gray-700 hover:text-gray-900 border border-transparent hover:border-purple-100" 
                        onClick={() => setOpen(false)}
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r from-purple-100 to-pink-100">
                          <MapPinned className="h-4 w-4 text-purple-600" />
                        </div>
                        <span className="font-medium">Admin - All Ads</span>
                      </Link>
                    ) : null}
                    
                    <button 
                      onClick={() => { try { logEvent({ eventType: 'logout_click', path: typeof location !== 'undefined' ? location.pathname : '/', country }); } catch {}; signOut({ callbackUrl: '/' }); }} 
                      className="flex items-center space-x-3 w-full px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-red-50 hover:to-orange-50 transition-all duration-200 text-gray-700 hover:text-gray-900 border border-transparent hover:border-red-100"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r from-red-100 to-orange-100">
                        <LogOut className="h-4 w-4 text-red-600" />
                      </div>
                      <span className="font-medium">Sign Out</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <button 
                    onClick={() => { setAuthCallbackUrl('/'); setAuthReason(undefined); handleGoogleSignIn(); }}
                    disabled={isSigningIn}
                    className="flex items-center justify-center space-x-3 w-full px-4 py-3 border-2 border-blue-200 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-emerald-50 hover:border-blue-300 transition-all duration-200 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                  >
                    {isSigningIn ? (
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500">
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white shadow-sm">
                        <GoogleIcon />
                      </div>
                    )}
                    <span className="font-semibold">
                      {isSigningIn ? 'Directing to Google...' : 'Continue with Google'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </Drawer>

        {/* Auth Modal */}
        {authModalOpen && status !== 'authenticated' ? (
          <Modal open={authModalOpen} onClose={() => setAuthModalOpen(false)} zIndexClass="z-[1300]" title={authReason || 'Sign in to continue'}>
            <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden">
              <div className="p-4">
                <button 
                  onClick={handleGoogleSignIn}
                  disabled={isSigningIn}
                  className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 hover:border-gray-300 hover:shadow-md text-gray-700 font-medium py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSigningIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />}
                  <span>{isSigningIn ? 'Directing to Google...' : 'Continue with Google'}</span>
                </button>
              </div>
            </div>
          </Modal>
        ) : null}

        {children}
      </div>
    </AuthModalContext.Provider>
  );
}

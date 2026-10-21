import AuthGate from '@/app/auth/AuthGate';
import DesktopSidebar from '@/app/(modules)/dashboard/components/AppNav/DesktopSidebar';
import Loading from '@/app/(modules)/dashboard/loading';
import MobileTabBar from '@/app/(modules)/dashboard/components/AppNav/MobileTabBar';
import { QueryProvider } from '@/app/providers/query-provider';
import { Suspense } from 'react';
import { UserProvider } from '@/app/(modules)/dashboard/(modules)/_user/provider';

/**
 * Signed-in only. Sidebar from `md` up, a bottom tab bar below. Pages render
 * their children straight into the column (a `PageHeader` first), which
 * spaces them. The User loads before anything shows.
 */
export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGate signedIn>
      <QueryProvider>
        <Suspense fallback={<Loading />}>
          <UserProvider>
            <div className="flex min-h-dvh">
              <DesktopSidebar />
              <main className="min-w-0 flex-1 px-4 pb-28 pt-4 md:px-10 md:pb-18 md:pt-8">
                <div className="mx-auto flex max-w-[1180px] flex-col gap-8 md:gap-12">
                  {children}
                </div>
              </main>
            </div>
            <MobileTabBar />
          </UserProvider>
        </Suspense>
      </QueryProvider>
    </AuthGate>
  );
}

'use client';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/app/components/ui/tabs';

import { ChevronLeft } from 'lucide-react';
import { EProfileView } from '@/app/(modules)/dashboard/(modules)/profile/enum';
import Link from 'next/link';
import PageHeader from '@/app/components/layout/PageHeader';
import Preferences from '@/app/(modules)/dashboard/(modules)/profile/components/Appearance';
import Profile from '@/app/(modules)/dashboard/(modules)/profile/components/Profile';
import Security from '@/app/(modules)/dashboard/(modules)/profile/components/Security';
import SignOutButton from '@/app/(modules)/dashboard/(modules)/profile/components/SignOutButton';
import { useDictionary } from '@/app/providers/dictionary-provider';

const TABS = [
  { value: EProfileView.MY_PROFILE, label: 'profile', Content: Profile },
  { value: EProfileView.SECURITY, label: 'security', Content: Security },
  {
    value: EProfileView.PREFERENCES,
    label: 'preferences',
    Content: Preferences,
  },
] as const;

export default function Page() {
  const { profile, dashboard } = useDictionary();

  return (
    <>
      <PageHeader
        title={profile.page.title}
        description={profile.page.description}
        actions={<SignOutButton />}
        mobileActions={null}
        mobileLeading={
          <Link
            href="/dashboard"
            aria-label={profile.page.back}
            className="-ml-2 flex size-11 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronLeft aria-hidden className="size-6" />
          </Link>
        }
        mobileTitle={dashboard.sidebar.account}
      />
      <Tabs defaultValue={EProfileView.MY_PROFILE} className="-mt-4 md:-mt-6">
        <TabsList
          aria-label={profile.page.tabs}
          className="grid h-auto w-full grid-cols-3 gap-1 rounded-md bg-muted p-1 md:flex md:w-auto md:justify-start md:gap-7 md:rounded-none md:border-b md:bg-transparent md:p-0"
        >
          {TABS.map(({ value, label }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="h-9 rounded-[7px] px-2 text-[13px] font-bold text-secondary-foreground data-[state=active]:font-extrabold data-[state=active]:text-foreground data-[state=active]:shadow-sm md:-mb-px md:h-11 md:rounded-none md:border-b-2 md:border-transparent md:px-0.5 md:text-[15px] md:data-[state=active]:border-primary md:data-[state=active]:bg-transparent md:data-[state=active]:shadow-none"
            >
              {profile.menuOptions[label]}
            </TabsTrigger>
          ))}
        </TabsList>
        {TABS.map((tab) => (
          <TabsContent
            key={tab.value}
            value={tab.value}
            className="mt-8 md:mt-10"
          >
            <tab.Content />
          </TabsContent>
        ))}
      </Tabs>
      <SignOutButton className="md:hidden" />
    </>
  );
}

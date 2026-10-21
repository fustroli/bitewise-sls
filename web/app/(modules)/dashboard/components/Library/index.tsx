'use client';

import Library from '@/app/(modules)/dashboard/components/Library/Library';
import { statisticsQuery } from '@/app/(modules)/dashboard/queries';
import { useSuspenseQuery } from '@tanstack/react-query';

/** Loads the counts the library cards show. */
const LibrarySection = () => {
  const { data: counts } = useSuspenseQuery(statisticsQuery);
  return <Library counts={counts} />;
};

export default LibrarySection;

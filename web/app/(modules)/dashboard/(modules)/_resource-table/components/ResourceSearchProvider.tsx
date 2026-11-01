'use client';

import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useState,
  useTransition,
} from 'react';
import {
  buildSearchHref,
  normalizeSearch,
} from '@/app/(modules)/dashboard/(modules)/_resource-table/helpers';
import { usePathname, useRouter } from 'next/navigation';

import { ISortState } from '@/app/(modules)/dashboard/(modules)/_resource-table/interfaces';
import { cn } from '@/app/lib/utils';

interface IResourceSearchContext {
  /** What the search bar shows, applied or not. */
  term: string;
  setTerm: (term: string) => void;
  /** Puts a term in the URL, without a history entry; a no-op if unchanged. */
  apply: (term: string) => void;
  clear: () => void;
  /** True while a search loads. */
  isPending: boolean;
}

const ResourceSearchContext = createContext<IResourceSearchContext | null>(
  null,
);

export const useResourceSearch = () => {
  const context = useContext(ResourceSearchContext);
  if (!context) {
    throw new Error(
      'useResourceSearch must be used within a ResourceSearchProvider',
    );
  }
  return context;
};

interface IProps extends PropsWithChildren {
  /** The search in the URL. */
  search: string | undefined;
  sort: ISortState;
}

/**
 * Holds a list's search term, outside the table's Suspense boundary so the
 * search bar keeps its value and focus while results load.
 */
export const ResourceSearchProvider = ({ search, sort, children }: IProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [term, setTerm] = useState(search ?? '');
  const [applied, setApplied] = useState(search);

  // The URL changed by other means (back/forward): show its search.
  if (!isPending && search !== applied) {
    setApplied(search);
    setTerm(search ?? '');
  }

  const apply = useCallback(
    (value: string) => {
      const next = normalizeSearch(value);
      if (next === applied) return;

      setApplied(next);
      startTransition(() => {
        router.replace(`${pathname}${buildSearchHref(sort, next)}`, {
          scroll: false,
        });
      });
    },
    [applied, pathname, router, sort],
  );

  const clear = useCallback(() => {
    setTerm('');
    apply('');
  }, [apply]);

  return (
    <ResourceSearchContext.Provider
      value={{ term, setTerm, apply, clear, isPending }}
    >
      {children}
    </ResourceSearchContext.Provider>
  );
};

/** Dims the list while a search loads; the old rows stay until then. */
export const ResourceSearchPending = ({ children }: PropsWithChildren) => {
  const { isPending } = useResourceSearch();

  return (
    <div
      aria-busy={isPending}
      className={cn(
        'flex flex-col gap-4 transition-opacity',
        isPending && 'pointer-events-none opacity-60',
      )}
    >
      {children}
    </div>
  );
};

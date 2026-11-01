'use client';

import { KeyboardEvent, useEffect } from 'react';
import { LoaderCircle, Search, X } from 'lucide-react';

import { Input } from '@/app/components/ui/input';
import { SEARCH_DEBOUNCE_MS } from '@/app/(modules)/dashboard/(modules)/_resource-table/constants';
import { TResourceKey } from '@/app/(modules)/dashboard/(modules)/_resource-table/interfaces';
import { cn } from '@/app/lib/utils';
import { getResourceLabels } from '@/app/(modules)/dashboard/(modules)/_resource-table/helpers';
import { useDictionary } from '@/app/providers/dictionary-provider';
import { useResourceSearch } from '@/app/(modules)/dashboard/(modules)/_resource-table/components/ResourceSearchProvider';

interface IProps {
  resourceKey: TResourceKey;
}

/**
 * Searches a list by name: applied 300 ms after typing stops, or right away
 * on Enter. × and Escape clear it.
 */
const ResourceSearch = ({ resourceKey }: IProps) => {
  const dictionary = useDictionary();
  const { term, setTerm, apply, clear, isPending } = useResourceSearch();
  const placeholder = getResourceLabels(
    dictionary,
    resourceKey,
  ).searchPlaceholder;

  useEffect(() => {
    const timeout = setTimeout(() => apply(term), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [term, apply]);

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      apply(term);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      clear();
    }
  };

  const Icon = isPending ? LoaderCircle : Search;

  return (
    <div className="relative w-full md:max-w-[380px]">
      <Icon
        aria-hidden
        className={cn(
          'pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground',
          isPending && 'animate-spin',
        )}
      />
      <Input
        type="search"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-11 bg-card pl-[42px] pr-10 text-base md:text-[15px] [&::-webkit-search-cancel-button]:hidden"
      />
      {term && (
        <button
          type="button"
          onClick={clear}
          aria-label={dictionary.resourceTable.clearSearch}
          className="absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
};

export default ResourceSearch;

'use client';

import { Button } from '@/app/components/ui/button';
import { useDictionary } from '@/app/providers/dictionary-provider';
import { useResourceSearch } from '@/app/(modules)/dashboard/(modules)/_resource-table/components/ResourceSearchProvider';

const ClearSearchButton = () => {
  const { resourceTable } = useDictionary();
  const { clear } = useResourceSearch();

  return (
    <Button type="button" variant="outline" onClick={clear}>
      {resourceTable.clearSearch}
    </Button>
  );
};

export default ClearSearchButton;

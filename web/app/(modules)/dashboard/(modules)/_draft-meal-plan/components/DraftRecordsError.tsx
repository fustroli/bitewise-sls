'use client';

import { Button } from '@/app/components/ui/button';
import { useDictionary } from '@/app/providers/dictionary-provider';

interface IProps {
  onRetry: () => void;
}

/** In place of a draft or week whose Meals and Ingredients failed to load. */
const DraftRecordsError = ({ onRetry }: IProps) => {
  const { draftMealPlan: labels } = useDictionary();

  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-lg border p-4"
    >
      <p className="text-sm text-destructive">{labels.recordsError}</p>
      <Button type="button" variant="outline" onClick={onRetry}>
        {labels.load.retry}
      </Button>
    </div>
  );
};

export default DraftRecordsError;

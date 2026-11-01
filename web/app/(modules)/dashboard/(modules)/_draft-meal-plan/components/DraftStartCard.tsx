'use client';

import { Button } from '@/app/components/ui/button';
import { useDictionary } from '@/app/providers/dictionary-provider';
import { useDraftMealPlan } from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/context';

/** Phone width, without a draft: the header's buttons as a card. */
const DraftStartCard = () => {
  const labels = useDictionary().draftMealPlan;
  const { start, openLoad } = useDraftMealPlan();

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 md:hidden">
      <div className="flex flex-col gap-0.5">
        <p className="text-[15px] font-extrabold">{labels.header.cardTitle}</p>
        <p className="text-[13px] text-muted-foreground">
          {labels.startDescription}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" onClick={() => openLoad()}>
          {labels.header.loadShort}
        </Button>
        <Button type="button" onClick={start}>
          {labels.start}
        </Button>
      </div>
    </div>
  );
};

export default DraftStartCard;

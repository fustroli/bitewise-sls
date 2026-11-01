'use client';

import { Download, Plus } from 'lucide-react';

import { Button } from '@/app/components/ui/button';
import { useDictionary } from '@/app/providers/dictionary-provider';
import { useDraftMealPlan } from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/context';

/**
 * The dashboard header's Load meal plan and Start draft day, while there's no
 * draft; once there is, the editor has its own Load meal plan.
 */
const DraftActions = () => {
  const labels = useDictionary().draftMealPlan;
  const { stored, start, openLoad } = useDraftMealPlan();

  if (stored) return null;

  return (
    <>
      <Button type="button" variant="outline" onClick={() => openLoad()}>
        <Download aria-hidden />
        {labels.load.button}
      </Button>
      <Button type="button" onClick={start}>
        <Plus aria-hidden />
        {labels.header.startDay}
      </Button>
    </>
  );
};

export default DraftActions;

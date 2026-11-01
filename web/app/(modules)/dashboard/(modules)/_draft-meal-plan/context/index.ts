import React, { useContext } from 'react';

import { IDraftMealPlanContext } from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/interfaces';

export const DraftMealPlanContext =
  React.createContext<IDraftMealPlanContext | null>(null);

export const useDraftMealPlan = () => {
  const context = useContext(DraftMealPlanContext);
  if (!context) {
    throw new Error(
      'useDraftMealPlan must be used within a DraftMealPlanProvider',
    );
  }
  return context;
};

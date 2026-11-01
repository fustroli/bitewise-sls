import React, { useContext } from 'react';

import { IWeekPlanContext } from '@/app/(modules)/dashboard/(modules)/_week-plan/interfaces';

export const WeekPlanContext = React.createContext<IWeekPlanContext | null>(
  null,
);

export const useWeekPlan = () => {
  const context = useContext(WeekPlanContext);
  if (!context) {
    throw new Error('useWeekPlan must be used within a WeekPlanProvider');
  }
  return context;
};

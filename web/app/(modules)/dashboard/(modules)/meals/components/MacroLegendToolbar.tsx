'use client';

import MacroLegend from '@/app/components/nutrition/MacroLegend';
import { useDictionary } from '@/app/providers/dictionary-provider';

/** The list toolbar's key to the macro colours. */
const MacroLegendToolbar = () => (
  <MacroLegend
    labels={useDictionary().dashboard.bodyMetrics.macros.macros}
    className="gap-x-4 text-[13px] text-secondary-foreground"
  />
);

export default MacroLegendToolbar;

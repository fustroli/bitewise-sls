import { cn } from '@/app/lib';

interface IProps {
  labels: { protein: string; carbs: string; fat: string };
  className?: string;
}

export const MACRO_SWATCHES = {
  protein: 'bg-protein',
  carbs: 'bg-carbs',
  fat: 'bg-fat',
} as const;

/** A coloured square for a macro, as in the bars and the legend. */
export const MacroSwatch = ({
  macro,
}: {
  macro: keyof typeof MACRO_SWATCHES;
}) => (
  <span
    aria-hidden
    className={cn('size-2 shrink-0 rounded-[2px]', MACRO_SWATCHES[macro])}
  />
);

/** What the macro colours mean. */
const MacroLegend = ({ labels, className }: IProps) => (
  <ul
    className={cn(
      'flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs font-bold text-muted-foreground',
      className,
    )}
  >
    {(['protein', 'carbs', 'fat'] as const).map((macro) => (
      <li key={macro} className="flex items-center gap-1.5">
        <MacroSwatch macro={macro} />
        {labels[macro]}
      </li>
    ))}
  </ul>
);

export default MacroLegend;

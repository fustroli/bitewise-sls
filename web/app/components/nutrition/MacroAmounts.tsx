import { MacroSwatch } from '@/app/components/nutrition/MacroLegend';
import { cn } from '@/app/lib';

type TMacros = { protein: string; carbs: string; fat: string };

interface IProps {
  /** Formatted grams, e.g. "12.1". */
  amounts: TMacros;
  /** Read out by screen readers; the swatch colour names it on screen. */
  names: TMacros;
  className?: string;
}

/** Protein, carbs and fat as compact pills, each marked by its colour. */
const MacroAmounts = ({ amounts, names, className }: IProps) => (
  <ul className={cn('flex flex-wrap items-center gap-1.5 text-xs', className)}>
    {(['protein', 'carbs', 'fat'] as const).map((macro) => (
      <li
        key={macro}
        className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1"
      >
        <MacroSwatch macro={macro} />
        <span className="sr-only">{names[macro]}</span>
        <span>
          <strong className="font-bold tabular-nums">{amounts[macro]}</strong>
          <span className="text-muted-foreground"> g</span>
        </span>
      </li>
    ))}
  </ul>
);

export default MacroAmounts;

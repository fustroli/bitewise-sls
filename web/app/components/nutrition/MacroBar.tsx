import { IMacroGrams } from '@/app/utils/helpers';
import { cn } from '@/app/lib';

interface IProps {
  /**
   * Each macro's share of the energy, as fractions; from `macroEnergyShares`
   * for food, or a Macro plan's own split for a target.
   */
  shares: IMacroGrams;
  /** Tailwind height class; defaults to `h-2.5`. */
  heightClassName?: string;
  className?: string;
}

const SEGMENTS = [
  { macro: 'protein', className: 'bg-protein' },
  { macro: 'carbs', className: 'bg-carbs' },
  { macro: 'fat', className: 'bg-fat' },
] as const;

/** Protein, carbs and fat stacked by their share of the energy. Decorative. */
const MacroBar = ({ shares, heightClassName = 'h-2.5', className }: IProps) => (
  <div
    aria-hidden
    className={cn(
      'flex gap-0.5 overflow-hidden rounded-full bg-muted',
      heightClassName,
      className,
    )}
  >
    {SEGMENTS.filter(({ macro }) => shares[macro] > 0).map(
      ({ macro, className: segment }) => (
        <div
          key={macro}
          className={cn('h-full', segment)}
          style={{ flexGrow: shares[macro] }}
        />
      ),
    )}
  </div>
);

export default MacroBar;

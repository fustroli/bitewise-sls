import { cn } from '@/app/lib';
import { scalePosition } from '@/app/utils/helpers';

export interface IRangeZone {
  label: string;
  from: number;
  to: number;
  /** A `bg-zone-*` class. */
  className: string;
}

interface IProps {
  zones: IRangeZone[];
  value: number;
  min: number;
  max: number;
  /** Values to label under the bar. */
  ticks: { value: number; label: string }[];
  /** Read out for the marker, e.g. "Your BMI: 23.8". */
  valueLabel: string;
  /** Zone names under the ticks; leave out when they'd crowd. */
  showZoneLabels?: boolean;
}

/** Coloured reference zones with a marker at the value, clamped to the ends. */
const RangeScale = ({
  zones,
  value,
  min,
  max,
  ticks,
  valueLabel,
  showZoneLabels,
}: IProps) => (
  <div className="flex flex-col gap-2 pt-2">
    <div className="relative">
      <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full">
        {zones.map((zone) => (
          <div
            key={zone.label}
            className={cn('h-full', zone.className)}
            style={{ flexGrow: Math.max(zone.to - zone.from, 0) }}
          />
        ))}
      </div>
      <div
        role="img"
        aria-label={valueLabel}
        className="absolute -top-1.5 -ml-0.5 h-[22px] w-1 rounded-sm bg-foreground ring-2 ring-card"
        style={{ left: `${scalePosition(value, min, max)}%` }}
      />
    </div>
    <div aria-hidden className="relative h-4 text-xs text-muted-foreground">
      {ticks.map((tick) => (
        <span
          key={tick.value}
          className="absolute -translate-x-1/2"
          style={{ left: `${scalePosition(tick.value, min, max)}%` }}
        >
          {tick.label}
        </span>
      ))}
    </div>
    {showZoneLabels && (
      <div
        aria-hidden
        className="flex justify-between gap-2 text-xs font-bold text-secondary-foreground"
      >
        {zones.map((zone) => (
          <span key={zone.label}>{zone.label}</span>
        ))}
      </div>
    )}
  </div>
);

export default RangeScale;

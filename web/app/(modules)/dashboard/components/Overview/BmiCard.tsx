import {
  formatBmi,
  formatBmiBand,
  formatWeight,
} from '@/app/(modules)/dashboard/(modules)/_body-metrics/helpers';

import { BMI_BANDS } from '@/app/(modules)/dashboard/(modules)/_body-metrics/constants';
import { BMI_SCALE } from '@/app/(modules)/dashboard/components/Overview/overview.constants';
import { BMI_ZONES } from '@/app/(modules)/dashboard/components/Overview/overview.helpers';
import BandTable from '@/app/(modules)/dashboard/components/Overview/BandTable';
import { Card } from '@/app/components/ui/card';
import CardHeading from '@/app/(modules)/dashboard/components/Overview/CardHeading';
import Chip from '@/app/components/display/Chip';
import { IBmi } from '@/app/(modules)/dashboard/(modules)/_body-metrics/interfaces';
import RangeScale from '@/app/components/display/RangeScale';
import { interpolate } from '@/app/utils/helpers';
import { useDictionary } from '@/app/providers/dictionary-provider';

interface IProps {
  bmi: IBmi;
  locale: string;
}

const BmiCard = ({ bmi, locale }: IProps) => {
  const labels = useDictionary().dashboard.bodyMetrics.bmi;
  const value = formatBmi(bmi.value, locale);

  return (
    <Card className="flex flex-col gap-4 p-4 md:gap-5 md:p-6">
      <CardHeading
        title={labels.title}
        description={labels.description}
        aside={
          <p className="flex items-center gap-2.5">
            <span className="text-[22px] font-extrabold md:text-[26px]">
              {value}
            </span>
            <Chip>{labels.categories[bmi.category]}</Chip>
          </p>
        }
      />
      <RangeScale
        zones={BMI_ZONES.map(({ zone, from, to, className }) => ({
          label: labels.zones[zone],
          from,
          to,
          className,
        }))}
        value={bmi.value}
        min={BMI_SCALE.min}
        max={BMI_SCALE.max}
        ticks={BMI_SCALE.ticks.map((tick) => ({
          value: tick,
          label: tick.toLocaleString(locale),
        }))}
        valueLabel={interpolate(labels.marker, { value })}
        showZoneLabels
      />
      <p className="text-[13px] text-secondary-foreground">
        {interpolate(labels.healthyWeight, {
          min: formatWeight(bmi.healthyWeight.minKg, locale),
          max: formatWeight(bmi.healthyWeight.maxKg, locale),
        })}
      </p>
      <BandTable
        caption={labels.description}
        showLabel={labels.showTable}
        hideLabel={labels.hideTable}
        rows={BMI_BANDS.map((band) => ({
          key: band.category,
          label: labels.categories[band.category],
          range: formatBmiBand(band, locale),
          current: band.category === bmi.category,
        }))}
      />
    </Card>
  );
};

export default BmiCard;

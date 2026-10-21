import {
  bodyFatTicks,
  bodyFatZones,
} from '@/app/(modules)/dashboard/components/Overview/overview.helpers';
import {
  formatBodyFat,
  formatBodyFatBand,
  formatWeight,
} from '@/app/(modules)/dashboard/(modules)/_body-metrics/helpers';

import { BODY_FAT_BANDS } from '@/app/(modules)/dashboard/(modules)/_body-metrics/constants';
import { BODY_FAT_SCALE } from '@/app/(modules)/dashboard/components/Overview/overview.constants';
import BandTable from '@/app/(modules)/dashboard/components/Overview/BandTable';
import { Card } from '@/app/components/ui/card';
import CardHeading from '@/app/(modules)/dashboard/components/Overview/CardHeading';
import Chip from '@/app/components/display/Chip';
import { ESex } from '@/app/(modules)/dashboard/(modules)/_user/enums';
import { IBodyFat } from '@/app/(modules)/dashboard/(modules)/_body-metrics/interfaces';
import MissingInputs from '@/app/(modules)/dashboard/components/Overview/MissingInputs';
import RangeScale from '@/app/components/display/RangeScale';
import SubtleStat from '@/app/components/display/SubtleStat';
import { interpolate } from '@/app/utils/helpers';
import { useDictionary } from '@/app/providers/dictionary-provider';

const PERCENT = 100;

interface IProps {
  bodyFat?: IBodyFat;
  /** Picks the bands; set whenever `bodyFat` is. */
  sex?: ESex | null;
  /** Some input is missing, rather than the inputs giving no result. */
  inputsMissing: boolean;
  locale: string;
  bodyStatsHref: string;
}

const BodyFatCard = ({
  bodyFat,
  sex,
  inputsMissing,
  locale,
  bodyStatsHref,
}: IProps) => {
  const labels = useDictionary().dashboard.bodyMetrics.bodyFat;

  if (!bodyFat || !sex) {
    return (
      <Card className="flex flex-col gap-4 p-4 md:gap-5 md:p-6">
        <CardHeading title={labels.title} description={labels.description} />
        <MissingInputs
          message={inputsMissing ? labels.empty : labels.implausible}
          linkLabel={
            inputsMissing ? labels.addMeasurements : labels.checkMeasurements
          }
          href={bodyStatsHref}
        />
      </Card>
    );
  }

  const value = formatBodyFat(bodyFat.percent, locale);
  const kg = (mass: number) =>
    interpolate(labels.kg, { value: formatWeight(mass, locale) });
  const percent = (tick: number) =>
    (tick / PERCENT).toLocaleString(locale, { style: 'percent' });

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
            <Chip>{labels.categories[bodyFat.category]}</Chip>
          </p>
        }
      />
      <RangeScale
        zones={bodyFatZones(sex).map(({ category, ...zone }) => ({
          label: labels.categories[category],
          ...zone,
        }))}
        value={bodyFat.percent}
        min={BODY_FAT_SCALE.min}
        max={BODY_FAT_SCALE.max}
        ticks={bodyFatTicks(sex).map((tick) => ({
          value: tick,
          label: percent(tick),
        }))}
        valueLabel={interpolate(labels.marker, { value })}
      />
      <div className="grid grid-cols-2 gap-2 md:gap-3">
        <SubtleStat label={labels.fatMass} value={kg(bodyFat.fatMassKg)} />
        <SubtleStat label={labels.leanMass} value={kg(bodyFat.leanMassKg)} />
      </div>
      <BandTable
        caption={labels.description}
        showLabel={labels.showTable}
        hideLabel={labels.hideTable}
        rows={BODY_FAT_BANDS[sex].map((band) => ({
          key: band.category,
          label: labels.categories[band.category],
          range: formatBodyFatBand(band, locale),
          current: band.category === bodyFat.category,
        }))}
      />
    </Card>
  );
};

export default BodyFatCard;

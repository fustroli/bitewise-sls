import { ReactNode } from 'react';

interface IProps {
  label: string;
  value: ReactNode;
}

/** A label over a value on the subtle surface, e.g. "Fat mass 13.6 kg". */
const SubtleStat = ({ label, value }: IProps) => (
  <div className="flex flex-col gap-0.5 rounded-md bg-surface-subtle px-3.5 py-3">
    <span className="text-xs font-bold text-muted-foreground">{label}</span>
    <span className="text-[15px] font-extrabold">{value}</span>
  </div>
);

export default SubtleStat;

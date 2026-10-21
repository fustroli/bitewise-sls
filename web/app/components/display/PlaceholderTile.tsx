interface IProps {
  label: string;
  /** What the value still needs, e.g. "Needs height and weight". */
  hint: string;
}

/** A StatTile's dashed stand-in while its value can't be computed. */
const PlaceholderTile = ({ label, hint }: IProps) => (
  <div className="flex flex-col gap-2.5 rounded-lg border-[1.5px] border-dashed border-input p-4 md:p-5">
    <p className="text-[13px] font-bold text-muted-foreground">{label}</p>
    <p
      aria-hidden
      className="text-[26px] font-extrabold leading-none text-muted-foreground/50 md:text-[32px]"
    >
      —
    </p>
    <p className="text-[13px] text-muted-foreground">{hint}</p>
  </div>
);

export default PlaceholderTile;

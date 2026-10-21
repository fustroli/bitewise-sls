export const VARIANTS = {
  h1: `text-4xl font-extrabold lg:text-5xl`,
  h2: `text-3xl font-semibold first:mt-0`,
  h3: `text-2xl font-semibold`,
  h4: `text-xl font-semibold`,
  p: `text-base leading-7`,
  blockquote: `mt-6 border-l-2 pl-6 italic`,
  code: `relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold`,
  lead: `text-xl text-muted-foreground`,
  large: `text-lg font-semibold`,
  small: `text-sm font-medium leading-none`,
  muted: `text-sm text-muted-foreground`,
};

export const BASE_CLASS = 'scroll-m-20 tracking-tight';

export type TVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'p'
  | 'blockquote'
  | 'code'
  | 'lead'
  | 'large'
  | 'small'
  | 'muted';

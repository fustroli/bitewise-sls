import { z } from 'zod';

const createUrlSchema = (dictionary: Record<string, string>) =>
  z.string().url(dictionary['invalidUrl']).or(z.literal(''));

export const createSocialProfilesSchema = (
  dictionary: Record<string, string>,
) =>
  z.object({
    facebook: createUrlSchema(dictionary),
    twitter: createUrlSchema(dictionary),
    instagram: createUrlSchema(dictionary),
    linkedin: createUrlSchema(dictionary),
  });

export type TSocialProfilesSchema = z.infer<
  ReturnType<typeof createSocialProfilesSchema>
>;

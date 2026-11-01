import {
  ACCEPTED_IMAGE_TYPES,
  MAX_FILE_SIZE,
} from '@/app/(modules)/dashboard/(modules)/_user/constants';

import { z } from 'zod';

export const createImageSchema = (dictionary: Record<string, string>) =>
  z.object({
    file: z
      .any()
      .refine((file) => {
        if (file.size === 0 || file.name === undefined) return false;
        else return true;
      }, dictionary['imageRequired'])

      .refine(
        (file) => ACCEPTED_IMAGE_TYPES.includes(file?.type),
        dictionary['imageType'],
      )
      .refine((file) => file.size <= MAX_FILE_SIZE, dictionary['imageSize']),
  });

export type TImageSchema = z.infer<ReturnType<typeof createImageSchema>>;

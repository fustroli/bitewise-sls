// Same limits as bitewise-backend's utils/constants.ts and pagination.dto.ts
export const MIN_LENGTH = 2;
export const MAX_LENGTH = 255;
// The EC2 app stored nutrients as decimal(10,1): at most this, rounded to one decimal
export const NUTRIENT_MAX = 999_999_999.9;

export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 100;
export const MAX_SEARCH_LENGTH = 100;
export const MAX_IDS = MAX_PAGE_LIMIT;

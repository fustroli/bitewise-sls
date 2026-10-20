// Same limits as bitewise-backend's utils/constants.ts and pagination.dto.ts
export const MIN_LENGTH = 2;
export const MAX_LENGTH = 255;
// The EC2 app stored nutrients as decimal(10,1): at most this, rounded to one decimal
export const NUTRIENT_MAX = 999_999_999.9;
// and quantities as decimal(10,2)
export const QUANTITY_MAX = 99_999_999.99;
// A Meal / Meal plan write is one DynamoDB transaction (max 100 items): parent + 2 name sentinels
// + every added and removed member
export const MAX_MEMBERS = 48;

export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 100;
export const MAX_SEARCH_LENGTH = 100;
export const MAX_IDS = MAX_PAGE_LIMIT;

export type TApiSuccess<T> = { ok: true; data: T };

export type TApiFailure = { ok: false; status: number; message: string };

export type TApiResult<T> = TApiSuccess<T> | TApiFailure;

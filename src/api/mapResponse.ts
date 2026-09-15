import type { AxiosResponse } from 'axios';
import { ApiResponse } from '../types';

/**
 * Screens read `response.data.data`. When the server's payload has a different
 * shape from what a screen renders, reshape it here once instead of in every
 * screen, keeping the rest of the axios response intact.
 */
export async function mapData<T, R>(
  request: Promise<AxiosResponse<ApiResponse<T>>>,
  fn: (data: T) => R,
): Promise<AxiosResponse<ApiResponse<R>>> {
  const res = await request;
  return { ...res, data: { ...res.data, data: fn(res.data?.data) } } as AxiosResponse<ApiResponse<R>>;
}

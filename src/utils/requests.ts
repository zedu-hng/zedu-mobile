import axios, {
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { BASE_URL } from '@env';
import { clearAllData, retrieveToken } from './helper';

const apiClient = axios.create({
  baseURL: `${BASE_URL}`,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await retrieveToken('token');

    if (token && config.headers)
      config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
);

export interface RequestResult<T> {
  data: T | null;
  error: string | null;
  status?: number;
  /** The session itself was rejected (401), so the user is no longer signed in. */
  unauthorized?: boolean;
  /** The request never reached the server: offline, DNS or timeout. */
  isNetworkError?: boolean;
}

/**
 * Tells an auth failure apart from a transport failure. Callers need this to
 * avoid signing a user out when the phone is simply offline.
 */
export const classifyRequestError = (error: any) => {
  const status: number | undefined =
    error?.response?.status ?? error?.response?.data?.status_code;

  return {
    status,
    unauthorized: status === 401,
    isNetworkError:
      !error?.response &&
      (error?.code === 'ERR_NETWORK' ||
        error?.code === 'ECONNABORTED' ||
        error?.message === 'Network Error'),
  };
};

export const request = async <T = any>(
  config: AxiosRequestConfig,
): Promise<RequestResult<T>> => {
  try {
    const response: AxiosResponse<T> = await apiClient(config);
    return { data: response.data, error: null, status: response.status };
  } catch (error: any) {
    const message =
      error.response?.data?.message || error.message || 'An error occurred';
    const failure = classifyRequestError(error);

    if (failure.unauthorized) {
      await clearAllData();
    }

    return { data: null, error: message, ...failure };
  }
};

export const GetRequest = <T = any>(url: string) =>
  request<T>({ method: 'GET', url });

export const PostRequest = <T = any>(url: string, data?: any) =>
  request<T>({ method: 'POST', url, data });

export const PatchRequest = <T = any>(url: string, data?: any) =>
  request<T>({ method: 'PATCH', url, data });

export const PutRequest = <T = any>(url: string, data?: any) =>
  request<T>({ method: 'PUT', url, data });

export const DeleteRequest = <T = any>(url: string) =>
  request<T>({ method: 'DELETE', url });

export const buildQueryString = (
  params: Record<string, string | number | boolean | undefined | null>,
): string => {
  const parts: string[] = [];

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    parts.push(
      `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    );
  });

  return parts.join('&');
};

export const UploadRequest = <T = any>(url: string, data: FormData) =>
  request<T>({
    method: 'POST',
    url,
    data,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 60000,
  });

export const PatchRequest2 = <T = any>(url: string, data: FormData) =>
  request<T>({
    method: 'PATCH',
    url,
    data,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 60000,
  });

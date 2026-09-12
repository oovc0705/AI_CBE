import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';

export interface Result<T = unknown> {
  code: number;
  message: string;
  data: T;
}

class HttpRequest {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: '/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.instance.interceptors.request.use(
      (config) => {
        // 自动注入全局请求头，例如 token
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    this.instance.interceptors.response.use(
      (response: AxiosResponse<Result>) => {
        if (response.config.responseType === 'blob') {
          return response;
        }
        const res = response.data;
        if (res.code !== 200) {
          // 统一处理业务错误码
          const error = new Error(res.message || '业务错误');
          (error as any).code = res.code;
          return Promise.reject(error);
        }
        return response;
      },
      (error) => {
        // 统一处理网络错误
        let msg = '网络错误';
        if (error.response) {
          msg = `HTTP ${error.response.status}: ${error.response.statusText}`;
        } else if (error.request) {
          msg = '请求未响应，请检查网络';
        } else {
          msg = error.message;
        }
        const err = new Error(msg);
        (err as any).origin = error;
        return Promise.reject(err);
      },
    );
  }

  private unwrap<T>(res: AxiosResponse<Result<T>>): T {
    if (res.config.responseType === 'blob') {
      return res.data as unknown as T;
    }
    return res.data.data;
  }

  get<T = unknown>(url: string, config?: AxiosRequestConfig) {
    return this.instance.get<Result<T>>(url, config).then((res) => this.unwrap(res));
  }

  post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return this.instance.post<Result<T>>(url, data, config).then((res) => this.unwrap(res));
  }

  put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return this.instance.put<Result<T>>(url, data, config).then((res) => this.unwrap(res));
  }

  delete<T = unknown>(url: string, config?: AxiosRequestConfig) {
    return this.instance.delete<Result<T>>(url, config).then((res) => this.unwrap(res));
  }

  upload<T = unknown>(url: string, formData: FormData, config?: AxiosRequestConfig) {
    return this.instance
      .post<Result<T>>(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        ...config,
      })
      .then((res) => res.data.data);
  }

  downloadBlob(url: string, filename: string) {
    return this.instance
      .get(url, { responseType: 'blob' })
      .then((res) => {
        const blob = new Blob([res.data]);
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(link.href);
      });
  }
}

export const request = new HttpRequest();

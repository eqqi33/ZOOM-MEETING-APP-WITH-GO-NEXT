import { AxiosError } from 'axios';

interface ErrorResponse {
  message: string;
  errors: any;
}

export interface CustomError {
  error: AxiosError;
  status: number;
  data: ErrorResponse | null;
  message: string;
}

const errorResponseHandler = (error: AxiosError): Promise<CustomError> | undefined => {
  if (error && error?.response) {
    // @ts-ignore
    const { status, data }: { status: number; data: ErrorResponse } = error.response;

    return Promise.reject({
      error,
      status,
      data: data ? data : null,
      message: data ? data.message : 'Terjadi kesalahan saat memproses permintaan.',
    });
  }

  if (error?.code == 'ERR_NETWORK') {
    return Promise.reject({
      error,
      message: 'Terjadi kesalahan, periksa kembali koneksi anda',
    });
  }

  return Promise.reject({
    error,
    message: 'Terjadi kesalahan',
  });
};

export default errorResponseHandler;

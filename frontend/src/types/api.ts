export type ApiSuccessEnvelope<T> = {
  success: true;
  message?: string;
  data: T;
};

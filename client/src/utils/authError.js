export const isAxiosErrorLike = (value) =>
  Boolean(value?.isAxiosError || value?.response);

export const getApiErrorStatus = (error) => error?.response?.status || null;

export const getApiErrorCode = (error) =>
  error?.response?.data?.data?.code || error?.response?.data?.code || null;

export const isUnauthorizedError = (error) => {
  if (!isAxiosErrorLike(error)) {
    return false;
  }

  const statusCode = getApiErrorStatus(error);
  const errorCode = getApiErrorCode(error);

  return (
    statusCode === 401 ||
    errorCode === "TOKEN_EXPIRED" ||
    errorCode === "AUTH_UNAUTHORIZED"
  );
};

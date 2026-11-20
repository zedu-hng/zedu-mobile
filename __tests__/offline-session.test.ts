import { classifyRequestError } from '@/utils/requests';
import { shouldSignOut } from '@/utils/sign-out';

describe('offline session handling', () => {
  it('treats a 401 as an auth failure that ends the session', () => {
    const failure = classifyRequestError({
      response: { status: 401, data: { message: 'Unauthorized' } },
    });

    expect(failure.unauthorized).toBe(true);
    expect(failure.isNetworkError).toBe(false);
    expect(shouldSignOut(failure)).toBe(true);
  });

  it('reads the status from the response body when the header is absent', () => {
    const failure = classifyRequestError({
      response: { data: { status_code: 401 } },
    });

    expect(failure.status).toBe(401);
    expect(shouldSignOut(failure)).toBe(true);
  });

  it('keeps the session when the phone is offline', () => {
    const failure = classifyRequestError({
      code: 'ERR_NETWORK',
      message: 'Network Error',
    });

    expect(failure.isNetworkError).toBe(true);
    expect(failure.unauthorized).toBe(false);
    expect(shouldSignOut(failure)).toBe(false);
  });

  it('keeps the session on a timeout', () => {
    expect(
      shouldSignOut(classifyRequestError({ code: 'ECONNABORTED' })),
    ).toBe(false);
  });

  it('keeps the session on a server error', () => {
    const failure = classifyRequestError({
      response: { status: 500, data: {} },
    });

    expect(failure.isNetworkError).toBe(false);
    expect(shouldSignOut(failure)).toBe(false);
  });
});

import { ApiErrorException } from '../api';

// Mock axios before importing api module
jest.mock('axios', () => {
  const mockAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  };

  return {
    __esModule: true,
    default: {
      create: jest.fn(() => mockAxiosInstance),
      isAxiosError: jest.fn(),
    },
  };
});

describe('ApiErrorException', () => {
  it('creates error with message and status code', () => {
    const error = new ApiErrorException('Test error', 404, 'Not Found');

    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(404);
    expect(error.error).toBe('Not Found');
    expect(error.name).toBe('ApiErrorException');
  });

  it('creates error with only message', () => {
    const error = new ApiErrorException('Test error');

    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBeUndefined();
    expect(error.error).toBeUndefined();
  });

  it('serializes to JSON correctly', () => {
    const error = new ApiErrorException(
      'Test error',
      500,
      'Internal Server Error',
    );
    const json = error.toJSON();

    expect(json).toEqual({
      name: 'ApiErrorException',
      message: 'Test error',
      statusCode: 500,
      error: 'Internal Server Error',
    });
  });

  it('maintains proper prototype chain', () => {
    const error = new ApiErrorException('Test error', 404, 'Not Found');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ApiErrorException);
  });
});

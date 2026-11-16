import ReactTestRenderer from 'react-test-renderer';
import { useChannelFiles } from '@/services/channels/channel-files';
import { GetRequest } from '@/utils/requests';

jest.mock('@/utils/requests', () => ({
  GetRequest: jest.fn(),
  buildQueryString: (params: Record<string, unknown>) =>
    Object.entries(params)
      .filter(
        ([, value]) => value !== undefined && value !== null && value !== '',
      )
      .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
      .join('&'),
}));

const mockGetRequest = GetRequest as jest.Mock;

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
};

const createDeferred = <T,>(): Deferred<T> => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(res => {
    resolve = res;
  });
  return { promise, resolve };
};

const fileResponse = (id: string) => ({
  data: {
    status: 'success',
    status_code: 200,
    message: '',
    data: [
      {
        id,
        file_name: `${id}.png`,
        file_type: 'png',
        mime_type: 'image/png',
        file_link: `https://example.com/${id}.png`,
        user_id: 'user-1',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    ],
  },
});

type ChannelFilesHook = ReturnType<typeof useChannelFiles>;

let latestHook: ChannelFilesHook;

const Probe = ({ category }: { category: string }) => {
  latestHook = useChannelFiles('channel-1', category);
  return null;
};

const renderGalleryHook = (category: string) => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<Probe category={category} />);
  });

  return {
    setCategory: (nextCategory: string) => {
      ReactTestRenderer.act(() => {
        renderer.update(<Probe category={nextCategory} />);
      });
    },
  };
};

describe('useChannelFiles', () => {
  beforeEach(() => {
    mockGetRequest.mockReset();
  });

  it('ignores a stale response from the previous media tab', async () => {
    const imagesRequest = createDeferred<ReturnType<typeof fileResponse>>();
    const videosRequest = createDeferred<ReturnType<typeof fileResponse>>();

    mockGetRequest.mockImplementation((url: string) =>
      url.includes('type=images')
        ? imagesRequest.promise
        : videosRequest.promise,
    );

    const { setCategory } = renderGalleryHook('images');

    expect(mockGetRequest).toHaveBeenCalledTimes(1);

    setCategory('videos');

    expect(mockGetRequest).toHaveBeenCalledTimes(2);

    await ReactTestRenderer.act(async () => {
      videosRequest.resolve(fileResponse('video-1'));
      await Promise.resolve();
    });

    expect(latestHook.files.map(file => file.id)).toEqual(['video-1']);

    await ReactTestRenderer.act(async () => {
      imagesRequest.resolve(fileResponse('image-1'));
      await Promise.resolve();
    });

    expect(latestHook.files.map(file => file.id)).toEqual(['video-1']);
    expect(latestHook.loading).toBe(false);
  });
});

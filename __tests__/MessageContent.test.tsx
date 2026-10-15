import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Linking } from 'react-native';
import { MessageContent } from '../src/components/layout/chat/message-content';

jest.mock('@/theme/ThemeProvider', () => ({
  useTheme: () => ({
    colors: {},
  }),
}));

jest.mock('@/theme/createMessageStyles', () => ({
  createMessageMarkdownStyles: () => ({
    link: {},
    strong: {},
    em: {},
    s: {},
    code_inline: {},
    channelMention: {},
    mention: {},
  }),
}));

jest.mock('@/components/ui/toast', () => ({
  ShowNotify: jest.fn(),
}));

jest.mock('../src/components/layout/chat/link-preview', () => ({
  MessageLinkPreviews: () => null,
}));

jest.mock('../src/components/layout/chat/chat-file-attachment', () => ({
  ChatFilePreviewModal: () => null,
}));

jest.mock('@/utils/document-preview', () => ({
  fileFromDocumentUrl: jest.fn(),
  isDocumentUrl: () => false,
}));

describe('MessageContent Google Sheets links', () => {
  const googleSheetsUrl =
    'https://docs.google.com/spreadsheets/d/test-sheet-id/edit';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('opens a Google Sheets link directly', async () => {
    const openURLSpy = jest
      .spyOn(Linking, 'openURL')
      .mockResolvedValueOnce(undefined);

    const canOpenURLSpy = jest.spyOn(Linking, 'canOpenURL');

    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <MessageContent
          html={`<p><a href="${googleSheetsUrl}">Open spreadsheet</a></p>`}
          showLinkPreviews={false}
        />,
      );
    });

    const link = renderer!.root.findAll(
      element =>
        (element.type as unknown as string) === 'Text' &&
        typeof element.props.onPress === 'function' &&
        element.props.children === 'Open spreadsheet',
    )[0];

    expect(link).toBeDefined();

    await ReactTestRenderer.act(async () => {
      link.props.onPress();
      await Promise.resolve();
    });

    expect(openURLSpy).toHaveBeenCalledWith(googleSheetsUrl);
    expect(canOpenURLSpy).not.toHaveBeenCalled();

    await ReactTestRenderer.act(() => {
      renderer?.unmount();
    });

    openURLSpy.mockRestore();
    canOpenURLSpy.mockRestore();
  });
});

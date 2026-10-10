import { formatPreviewMessage } from '@/utils/message-text';

describe('formatPreviewMessage', () => {
  it('decodes &nbsp; and renders a mention span as clean text', () => {
    const html =
      '<p><span class="mention" data-label="channel">@channel</span>&nbsp;All hands&nbsp;&amp; friends</p>';

    expect(formatPreviewMessage(html)).toBe('@channel All hands & friends');
  });
});

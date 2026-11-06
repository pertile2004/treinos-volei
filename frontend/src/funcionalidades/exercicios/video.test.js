import { describe, expect, it } from 'vitest';
import { urlDeEmbedDoYoutube } from './video.js';

const EMBED = 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ';

describe('urlDeEmbedDoYoutube', () => {
  it.each([
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ'],
    ['https://youtube.com/watch?v=dQw4w9WgXcQ&t=42s'],
    ['https://m.youtube.com/watch?feature=share&v=dQw4w9WgXcQ'],
    ['http://www.youtube.com/watch?v=dQw4w9WgXcQ'],
    ['https://www.youtube.com/embed/dQw4w9WgXcQ'],
    ['https://www.youtube.com/shorts/dQw4w9WgXcQ'],
    ['https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'],
  ])('converte %s para o embed sem cookies', (url) => {
    expect(urlDeEmbedDoYoutube(url)).toBe(EMBED);
  });

  it.each([['https://youtu.be/dQw4w9WgXcQ'], ['https://youtu.be/dQw4w9WgXcQ?si=abc']])(
    'converte o link curto %s',
    (url) => {
      expect(urlDeEmbedDoYoutube(url)).toBe(EMBED);
    },
  );

  it.each([
    ['https://vimeo.com/123456'],
    ['https://youtube.com.falso.example/watch?v=dQw4w9WgXcQ'],
    ['https://example.com/?v=dQw4w9WgXcQ'],
    ['javascript:alert(1)'],
    ['https://www.youtube.com/watch'],
    ['https://www.youtube.com/watch?v=curto'],
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ"onload="x'],
    ['https://youtu.be/'],
    ['ftp://www.youtube.com/watch?v=dQw4w9WgXcQ'],
    ['texto solto'],
    [''],
    [null],
    [undefined],
    [42],
  ])('devolve null para %s', (url) => {
    expect(urlDeEmbedDoYoutube(url)).toBeNull();
  });
});

import { urlDeEmbedDoYoutube } from '../video.js';

/** Player do YouTube sem cookies e sem autoplay. URL inválida ou de outro site: nada é renderizado. */
export default function PlayerVideo({ url, nome }) {
  const embed = urlDeEmbedDoYoutube(url);
  if (!embed) {
    return null;
  }
  return (
    <div className="aspect-video overflow-hidden rounded-cartao bg-superficie">
      <iframe
        src={embed}
        title={`Vídeo: ${nome}`}
        loading="lazy"
        allow="encrypted-media; picture-in-picture; fullscreen"
        referrerPolicy="strict-origin-when-cross-origin"
        className="size-full border-0"
      />
    </div>
  );
}

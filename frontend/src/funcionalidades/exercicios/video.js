// Só vídeos do YouTube são aceitos, e sempre pelo domínio sem cookies (card do PR-08).
const HOSTS_DO_YOUTUBE = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'www.youtube-nocookie.com'];
const HOSTS_CURTOS = ['youtu.be'];
const ID_DO_VIDEO = /^[A-Za-z0-9_-]{11}$/;
const CAMINHOS_COM_ID = /^\/(?:embed|shorts|v)\/([^/?#]+)/;

function extrairId(url) {
  if (HOSTS_CURTOS.includes(url.hostname)) {
    return url.pathname.slice(1).split('/')[0];
  }
  if (!HOSTS_DO_YOUTUBE.includes(url.hostname)) {
    return null;
  }
  if (url.pathname === '/watch') {
    return url.searchParams.get('v');
  }
  const caminho = url.pathname.match(CAMINHOS_COM_ID);
  return caminho ? caminho[1] : null;
}

/**
 * Converte uma URL do YouTube (watch?v=, youtu.be/, embed/, shorts/) para
 * `https://www.youtube-nocookie.com/embed/<id>`. Qualquer outra coisa devolve null: sem vídeo.
 */
export function urlDeEmbedDoYoutube(valor) {
  if (typeof valor !== 'string' || valor.trim() === '') {
    return null;
  }
  let url;
  try {
    url = new URL(valor.trim());
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return null;
  }
  const id = extrairId(url);
  if (!id || !ID_DO_VIDEO.test(id)) {
    return null;
  }
  return `https://www.youtube-nocookie.com/embed/${id}`;
}

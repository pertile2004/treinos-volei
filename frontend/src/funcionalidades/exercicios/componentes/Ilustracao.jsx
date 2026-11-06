/**
 * Ilustração do fundamento (SVG em `imagem_url`), sempre decorativa: o nome do exercício e as etiquetas
 * já dizem tudo em texto. O SVG usa `currentColor`, que um <img> não herda; por isso ele entra como
 * máscara e a cor vem do token de fundo.
 *
 * Só caminhos relativos da própria origem (ex.: /ilustracoes/saque.svg) viram máscara: uma URL absoluta
 * de outro domínio faria o navegador de todo usuário buscar um recurso de terceiro, e a CSP ainda não
 * tem `img-src` para barrar isso. Qualquer outro valor é ignorado e nada é desenhado.
 */
const CAMINHO_DA_PROPRIA_ORIGEM = /^\/(?![/\\])[^"'()\s\\]+$/;

export function ehCaminhoDaPropriaOrigem(src) {
  return typeof src === 'string' && CAMINHO_DA_PROPRIA_ORIGEM.test(src);
}

export default function Ilustracao({ src, className = '' }) {
  if (!ehCaminhoDaPropriaOrigem(src)) {
    return null;
  }
  const mascara = `url("${src}")`;
  return (
    <span
      aria-hidden="true"
      data-ilustracao=""
      className={`block shrink-0 bg-texto-secundario ${className}`.trim()}
      style={{
        maskImage: mascara,
        WebkitMaskImage: mascara,
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
      }}
    />
  );
}

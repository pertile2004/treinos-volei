/**
 * Ilustração do fundamento (SVG em `imagem_url`), sempre decorativa: o nome do exercício e as etiquetas
 * já dizem tudo em texto. O SVG usa `currentColor`, que um <img> não herda; por isso ele entra como
 * máscara e a cor vem do token de fundo.
 */
export default function Ilustracao({ src, className = '' }) {
  if (!src) {
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

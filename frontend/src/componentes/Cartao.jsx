import { Link } from 'react-router';

const ELEMENTOS = ['div', 'section', 'article', 'li'];

/** Superfície com raio de cartão. Com `para`, o cartão inteiro é um único link (não coloque outro controle dentro). */
export default function Cartao({ como = 'div', elevado = false, para, className = '', children, ...resto }) {
  const Elemento = ELEMENTOS.includes(como) ? como : 'div';
  // A borda aqui é só decorativa: o cartão não é um controle.
  const base = `rounded-cartao border border-borda text-texto ${elevado ? 'bg-superficie-elevada' : 'bg-superficie'}`;

  if (para !== undefined) {
    return (
      <Elemento className={`${base} transition-colors hover:border-borda-controle ${className}`.trim()} {...resto}>
        <Link
          to={para}
          className="block rounded-cartao p-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaria"
        >
          {children}
        </Link>
      </Elemento>
    );
  }

  return (
    <Elemento className={`${base} p-4 ${className}`.trim()} {...resto}>
      {children}
    </Elemento>
  );
}

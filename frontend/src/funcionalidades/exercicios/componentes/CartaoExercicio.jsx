import Cartao from '../../../componentes/Cartao.jsx';
import Etiqueta from '../../../componentes/Etiqueta.jsx';
import { formatarDuracao, resumirPadroes } from '../formatos.js';
import Ilustracao from './Ilustracao.jsx';

/** Item da lista da Biblioteca: o cartão inteiro é o link para o detalhe. */
export default function CartaoExercicio({ exercicio }) {
  const descanso = formatarDuracao(exercicio.descanso_segundos);
  return (
    <Cartao como="li" para={`/exercicios/${exercicio.id}`}>
      <div className="flex items-start gap-3">
        <Ilustracao src={exercicio.imagem_url} className="size-16" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h2 className="font-bold break-words">{exercicio.nome}</h2>
          <div className="flex flex-wrap gap-1">
            <Etiqueta tipo="fundamento" valor={exercicio.fundamento}>
              {exercicio.fundamento_rotulo}
            </Etiqueta>
            <Etiqueta>{exercicio.nivel_rotulo}</Etiqueta>
          </div>
          <p className="text-sm text-texto-secundario">
            {resumirPadroes(exercicio)}
            {descanso && ` · Descanso ${descanso}`}
            {exercicio.tem_video && ' · Com vídeo'}
          </p>
        </div>
      </div>
    </Cartao>
  );
}

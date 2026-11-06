import { useQuery } from '@tanstack/react-query';
import Carregando from '../../componentes/Carregando.jsx';
import MensagemDeErro from '../../componentes/MensagemDeErro.jsx';
import Pagina from '../../componentes/Pagina.jsx';
import { http } from '../../lib/http.js';

// A API pode devolver os campos na raiz ou dentro de `data`.
async function buscarSaude() {
  const resposta = await http.get('/saude');
  return resposta.data?.data ?? resposta.data;
}

const CAMPOS = [
  ['status', 'Status'],
  ['banco', 'Banco'],
  ['versao', 'Versão'],
  ['horario', 'Horário'],
];

export default function Status() {
  const consulta = useQuery({ queryKey: ['saude'], queryFn: buscarSaude, retry: false });
  const campos = CAMPOS.filter(([chave]) => consulta.data?.[chave] != null);
  return (
    <Pagina titulo="Status da API">
      {consulta.isPending && <Carregando />}
      {consulta.isError && <MensagemDeErro erro={consulta.error} aoTentarDeNovo={() => consulta.refetch()} />}
      {consulta.isSuccess && campos.length === 0 && <p>A API respondeu sem dados de saúde.</p>}
      {consulta.isSuccess && campos.length > 0 && (
        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
          {campos.map(([chave, rotulo]) => (
            <div key={chave} className="contents">
              <dt className="text-texto-secundario">{rotulo}</dt>
              <dd>{String(consulta.data[chave])}</dd>
            </div>
          ))}
        </dl>
      )}
    </Pagina>
  );
}

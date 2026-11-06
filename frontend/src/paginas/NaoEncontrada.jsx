import { Link } from 'react-router';
import Pagina from '../componentes/Pagina.jsx';

export default function NaoEncontrada() {
  return (
    <Pagina titulo="Página não encontrada">
      <p className="text-texto-secundario">O endereço que você abriu não existe.</p>
      <Link to="/" className="text-primaria underline">
        Voltar para o início
      </Link>
    </Pagina>
  );
}

import { Link } from 'react-router';
import Pagina from '../componentes/Pagina.jsx';
import FormularioCadastro from '../funcionalidades/autenticacao/componentes/FormularioCadastro.jsx';

export default function Cadastro() {
  return (
    <Pagina titulo="Crie sua conta">
      <div className="mt-4 flex flex-col gap-6">
        <FormularioCadastro />
        <p className="text-center text-sm text-texto-secundario">
          Já tem conta?{' '}
          <Link to="/entrar" className="font-bold text-primaria underline underline-offset-2">
            Entrar
          </Link>
        </p>
      </div>
    </Pagina>
  );
}

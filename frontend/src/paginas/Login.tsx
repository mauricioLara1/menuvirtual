import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import toast from 'react-hot-toast';
import { iniciarSesion, obtenerSesionActual } from '../api/auth';

interface Campos {
  usuario: string;
  password: string;
}

export default function Login() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Campos>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function enviar(campos: Campos) {
    try {
      await iniciarSesion(campos.usuario, campos.password);
      // Guardamos el usuario ya confirmado en la caché antes de navegar
      queryClient.setQueryData(['me'], await obtenerSesionActual());
      navigate('/admin');
    } catch (e) {
      if (isAxiosError(e) && e.response?.status === 429) {
        toast.error('Demasiados intentos. Espera unos minutos.');
      } else if (isAxiosError(e) && e.response?.status === 401) {
        toast.error('Credenciales inválidas');
      } else {
        toast.error('No pudimos iniciar sesión. Intenta de nuevo.');
      }
    }
  }

  return (
    <main className="pagina pagina-angosta">
      <h1 className="titulo">Ingresar</h1>
      <form className="formulario" onSubmit={handleSubmit(enviar)} noValidate>
        <label>
          Usuario
          <input type="text" autoComplete="username" {...register('usuario', { required: 'Escribe tu usuario' })} />
          {errors.usuario && <span className="error-campo">{errors.usuario.message}</span>}
        </label>
        <label>
          Contraseña
          <input type="password" autoComplete="current-password" {...register('password', { required: 'Escribe tu contraseña' })} />
          {errors.password && <span className="error-campo">{errors.password.message}</span>}
        </label>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}

import { useForm } from 'react-hook-form';
import { isAxiosError } from 'axios';
import toast from 'react-hot-toast';
import { cambiarMiClave } from '../../api/auth';
import { mensajeError } from '../../utils/errores';

interface Campos {
  actual: string;
  nueva: string;
  confirmar: string;
}

export default function MiClave() {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Campos>();

  async function enviar(c: Campos) {
    try {
      await cambiarMiClave(c.actual, c.nueva);
      toast.success('Contraseña actualizada');
      reset();
    } catch (e) {
      if (isAxiosError(e) && e.response?.status === 429) {
        toast.error('Demasiados intentos. Espera unos minutos.');
      } else {
        toast.error(mensajeError(e, 'No pudimos cambiar la contraseña.'));
      }
    }
  }

  return (
    <>
      <h1>Mi contraseña</h1>
      <form className="formulario formulario-ancho" onSubmit={handleSubmit(enviar)} noValidate>
        <label>
          Contraseña actual
          <input type="password" autoComplete="current-password" {...register('actual', { required: 'Escribe tu contraseña actual' })} />
          {errors.actual && <span className="error-campo">{errors.actual.message}</span>}
        </label>
        <label>
          Contraseña nueva
          <input
            type="password"
            autoComplete="new-password"
            maxLength={72}
            {...register('nueva', {
              required: 'Escribe la contraseña nueva',
              minLength: { value: 5, message: 'Mínimo 5 caracteres' },
            })}
          />
          {errors.nueva && <span className="error-campo">{errors.nueva.message}</span>}
        </label>
        <label>
          Repite la contraseña nueva
          <input
            type="password"
            autoComplete="new-password"
            {...register('confirmar', {
              required: 'Repite la contraseña nueva',
              validate: (v, f) => v === f.nueva || 'Las contraseñas no coinciden',
            })}
          />
          {errors.confirmar && <span className="error-campo">{errors.confirmar.message}</span>}
        </label>
        <div className="botones-fila">
          <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : 'Cambiar contraseña'}</button>
        </div>
      </form>
    </>
  );
}

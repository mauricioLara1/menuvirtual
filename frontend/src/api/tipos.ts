export interface Sucursal {
  id: number;
  nombre: string;
  direccion: string;
}

export interface Producto {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  imagen_url: string | null;
  categoria_id: number;
  categoria: string;
  sucursal_id: number;
}

export interface UsuarioSesion {
  id: number;
  usuario: string;
  rol: 'OWNER' | 'ADMIN';
  sucursal_id: number | null;
}

export interface Categoria {
  id: number;
  nombre: string;
}

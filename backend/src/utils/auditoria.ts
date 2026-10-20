// Texto legible con lo que cambió: "precio: 4000 -> 4500; nombre: A -> B"
export function describirCambios(
  antes: Record<string, any>,
  despues: Record<string, any>,
  campos: string[]
): string {
  const cambios = campos
    .filter((c) => antes[c] !== despues[c])
    .map((c) => `${c}: ${antes[c] ?? 'vacío'} -> ${despues[c] ?? 'vacío'}`);
  return cambios.length ? cambios.join('; ') : 'Sin cambios';
}

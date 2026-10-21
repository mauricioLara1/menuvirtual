// Fecha de hoy según la zona horaria del negocio, calculada por Postgres.
export const HOY_SQL = `(now() AT TIME ZONE 'America/Bogota')::date`;

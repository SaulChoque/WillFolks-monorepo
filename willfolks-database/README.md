# willfolks-database

Base de datos de WillFolks: PostgreSQL 16 en un contenedor local, con el esquema, las vistas
y datos semilla para desarrollo y pruebas e2e. La consume [`willfolks-BE`](../willfolks-BE).

## Uso

```bash
docker compose up --detach --wait   # levanta Postgres en 127.0.0.1:5432 y carga sql/ la primera vez
./scripts/reset.sh                  # borra el volumen y recrea todo desde sql/
docker compose down                 # detiene el contenedor (los datos quedan en el volumen)
```

Conexión por defecto (`postgres://willfolks:willfolks@127.0.0.1:5432/willfolks`); para cambiar
usuario, clave, nombre o puerto copia `.env.example` a `.env`. El puerto solo se publica en
`127.0.0.1`: son credenciales de desarrollo.

```bash
docker compose exec postgres psql -U willfolks -d willfolks   # consola SQL
```

Los `.sql` solo se ejecutan cuando el volumen está vacío. Tras editar el esquema hay que
correr `./scripts/reset.sh` (se pierden los datos locales).

## Contenido

| Ruta | Qué es |
| --- | --- |
| `sql/01_schema.sql` | **Fuente de verdad**: extensiones, tipos enumerados, 16 tablas, restricciones e índices. |
| `sql/02_views.sql` | Vistas de lectura: `v_user_balances` (saldos) y `v_goal_progress` (controles por meta). |
| `sql/03_seed.sql` | Cuatro usuarios de demostración con metas de cada tipo, movimientos e historial. |
| `sql/04_chain.sql` | Fase 1 on-chain: `escrow_state` y las columnas `escrow_*` de `goals`, y wallet única por usuario. Idempotente: se puede aplicar a una base con datos. |
| `docs/diccionario-de-datos.md` | Cada tabla y columna: tipo, nulabilidad, valor por defecto, claves, reglas y significado. |
| `docs/willfolks.dbml` | El modelo en DBML (pegar en dbdiagram.io). |
| `docs/modelo-er.md` | Diagrama ER en Mermaid, decisiones de diseño y diagramas de estados. |
| `scripts/reset.sh` | Recrea la base desde cero. |
| `scripts/data-dictionary.py` | Regenera el diccionario desde el catálogo de la base en ejecución. |

## Datos semilla

El backend trae un login de desarrollo sin contraseña: basta el correo.

| Correo | Usuario | Situación |
| --- | --- | --- |
| `saul@willfolks.dev` | `saul` | 72 USDC disponibles, 28 en custodia, una meta de cada tipo, amigo de Ana, solicitud pendiente de Leo. |
| `ana@willfolks.dev` | `ana` | Participa en la alarma compartida (modo `vs`) de Saul. |
| `leo@willfolks.dev` | `leo` | 30 USDC, sin metas; envió una solicitud a Saul. |
| `mia@willfolks.dev` | `mia` | Sin saldo ni amigos; útil para probar la búsqueda. |

Los UUID de la semilla son fijos (`1111…`, `2222…`, metas `a0000000-…-0001` a `0004`).

## Mantener la documentación

1. Cambia `sql/01_schema.sql`.
2. `./scripts/reset.sh`
3. `./scripts/data-dictionary.py` (falla si una columna nueva no tiene descripción).
4. Refleja el cambio en `docs/willfolks.dbml` y, si toca relaciones, en `docs/modelo-er.md`.
5. Ajusta la entidad correspondiente en `willfolks-BE/src/entities/` y corre sus pruebas.

No hay migraciones todavía: el esquema se recrea. Antes de tener datos que conservar habrá
que introducirlas (por ejemplo con las migraciones de TypeORM o con `dbmate`).

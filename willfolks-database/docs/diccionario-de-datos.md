# Diccionario de datos · WillFolks

> Generado por `scripts/data-dictionary.py` desde el catálogo de PostgreSQL. No editar a mano:
> cambia `sql/01_schema.sql` (o las descripciones del script) y vuelve a generarlo.

Convenciones: todas las claves primarias son `uuid`; las fechas con hora son `timestamptz` (UTC);
los montos son `numeric(18,6)` y siempre positivos.

## Tablas

- [`users`](#users) — Cuenta de una persona. Se crea en el primer inicio de sesión.
- [`user_settings`](#user_settings) — Preferencias de la app, una fila por usuario.
- [`devices`](#devices) — Instalaciones de la app y permisos nativos que tienen concedidos.
- [`friendships`](#friendships) — Relación entre dos usuarios; una sola fila por pareja.
- [`goals`](#goals) — Meta con apuesta ("William"). Los datos propios de cada tipo viven en `goal_*_settings`.
- [`goal_alarm_settings`](#goal_alarm_settings) — Configuración de una meta de alarma (1:1 con `goals`).
- [`goal_app_timer_settings`](#goal_app_timer_settings) — Configuración de una meta de límite de uso de una app (1:1 con `goals`).
- [`goal_location_settings`](#goal_location_settings) — Configuración de una meta de llegar a un lugar (1:1 con `goals`).
- [`goal_ai_settings`](#goal_ai_settings) — Configuración de una meta no medible, juzgada con evidencias (1:1 con `goals`).
- [`goal_participants`](#goal_participants) — Quién juega cada meta y cuánto tiene aún en custodia.
- [`goal_checkins`](#goal_checkins) — Veredicto de una meta para un usuario en un día. Es el historial de cumplimiento.
- [`proofs`](#proofs) — Evidencia fotográfica enviada para una meta juzgada.
- [`app_usage_samples`](#app_usage_samples) — Minutos diarios en primer plano por app, leídos del teléfono (RF-11).
- [`wallet_transactions`](#wallet_transactions) — Libro mayor: cada movimiento de dinero de un usuario. Los saldos se derivan de aquí.
- [`notifications`](#notifications) — Buzón de avisos del usuario (RF-13).
- [`pets`](#pets) — WillPet: la mascota que refleja la constancia del usuario.

### users

Cuenta de una persona. Se crea en el primer inicio de sesión.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
| --- | --- | --- | --- | --- | --- |
| `id` | `uuid` | no | `gen_random_uuid()` | PK | Identificador de la cuenta. |
| `email` | `citext` | no |  |  | Correo con el que inicia sesión. No distingue mayúsculas. |
| `username` | `citext` | sí |  |  | Alias público para que lo encuentren (3-24 letras, dígitos o `_`). Vacío hasta el onboarding. |
| `display_name` | `varchar(60)` | no |  |  | Nombre que ven los demás. |
| `avatar_url` | `text` | sí |  |  | Ruta de la foto de perfil subida al backend (`/uploads/avatars/...`). |
| `auth_provider` | `auth_provider` | no | `'dev'::auth_provider` |  | Proveedor con el que se autenticó. `dev` es el login sin contraseña de desarrollo. |
| `provider_subject` | `varchar(255)` | sí |  |  | Identificador del usuario en ese proveedor. |
| `wallet_address` | `varchar(42)` | sí |  |  | Dirección EVM de la billetera generada en el teléfono. |
| `chain` | `varchar(32)` | no | `'avalanche-fuji'::character varying` |  | Red donde vive la custodia de sus apuestas. |
| `location_label` | `varchar(120)` | sí |  |  | Ciudad o lugar que muestra en su perfil. |
| `timezone` | `varchar(64)` | no | `'UTC'::character varying` |  | Zona horaria IANA; alimenta la pestaña de horas de amigos. |
| `locale` | `varchar(10)` | no | `'en'::character varying` |  | Idioma de la app (`en`/`es`); las notificaciones se redactan en él. |
| `onboarding_completed_at` | `timestamptz` | sí |  |  | Momento en que terminó el onboarding. NULL = aún debe completarlo. |
| `created_at` | `timestamptz` | no | `now()` |  | Alta de la cuenta. |
| `updated_at` | `timestamptz` | no | `now()` |  | Última modificación (lo mantiene un trigger). |
| `deleted_at` | `timestamptz` | sí |  |  | Reservado para borrado lógico; hoy el borrado es físico. |

Reglas:

- `users_email_key`: único sobre `(email)`
- `users_provider_subject_unique`: único sobre `(auth_provider, provider_subject)`
- `users_username_key`: único sobre `(username)`
- `users_username_format`: `CHECK (((username IS NULL) OR (username ~ '^[a-zA-Z0-9_]{3,24}$'::citext)))`
- `users_wallet_format`: `CHECK (((wallet_address IS NULL) OR ((wallet_address)::text ~ '^0x[0-9a-fA-F]{40}$'::text)))`

### user_settings

Preferencias de la app, una fila por usuario.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
| --- | --- | --- | --- | --- | --- |
| `user_id` | `uuid` | no |  | PK, FK → `users` (cascade) | Usuario dueño de las preferencias. |
| `theme` | `theme_id` | no | `'acid'::theme_id` |  | Paleta de la interfaz: `acid` (verde) o `void` (oscura). |
| `haptics` | `boolean` | no | `true` |  | Vibración corta al tocar controles. |
| `show_seconds` | `boolean` | no | `true` |  | Mostrar segundos en el reloj de la pestaña Tiempo. |
| `reminders` | `boolean` | no | `true` |  | Programar recordatorios locales de las metas. |
| `vibration` | `boolean` | no | `true` |  | Vibrar mientras suena una alarma. |
| `updated_at` | `timestamptz` | no | `now()` |  | Última modificación. |

### devices

Instalaciones de la app y permisos nativos que tienen concedidos.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
| --- | --- | --- | --- | --- | --- |
| `id` | `uuid` | no | `gen_random_uuid()` | PK | Identificador del registro. |
| `user_id` | `uuid` | no |  | FK → `users` (cascade) | Usuario que usa el dispositivo. |
| `install_id` | `varchar(64)` | no |  |  | Identificador aleatorio de la instalación, generado en el teléfono. |
| `platform` | `device_platform` | no | `'android'::device_platform` |  | Sistema operativo. |
| `model` | `varchar(80)` | sí |  |  | Modelo del teléfono. |
| `os_version` | `varchar(40)` | sí |  |  | Versión del sistema operativo. |
| `app_version` | `varchar(20)` | sí |  |  | Versión de la app. |
| `notifications_granted` | `boolean` | no | `false` |  | Puede publicar notificaciones. |
| `exact_alarm_granted` | `boolean` | no | `false` |  | Puede programar alarmas exactas. |
| `usage_access_granted` | `boolean` | no | `false` |  | Tiene acceso al uso de apps (UsageStatsManager). |
| `camera_granted` | `boolean` | no | `false` |  | Puede usar la cámara. |
| `location_access` | `location_access` | no | `'none'::location_access` |  | Alcance del permiso de ubicación. |
| `last_seen_at` | `timestamptz` | no | `now()` |  | Última vez que la app reportó este dispositivo. |
| `created_at` | `timestamptz` | no | `now()` |  | Primer reporte del dispositivo. |

Reglas:

- `devices_user_install_unique`: único sobre `(user_id, install_id)`

### friendships

Relación entre dos usuarios; una sola fila por pareja.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
| --- | --- | --- | --- | --- | --- |
| `id` | `uuid` | no | `gen_random_uuid()` | PK | Identificador de la relación. |
| `requester_id` | `uuid` | no |  | FK → `users` (cascade) | Quien envió la solicitud. |
| `addressee_id` | `uuid` | no |  | FK → `users` (cascade) | Quien la recibió. |
| `status` | `friendship_status` | no | `'pending'::friendship_status` |  | Estado de la solicitud. |
| `created_at` | `timestamptz` | no | `now()` |  | Envío de la solicitud. |
| `responded_at` | `timestamptz` | sí |  |  | Momento en que se aceptó o rechazó. |

Reglas:

- `friendships_pair_unique`: único sobre `(LEAST(requester_id, addressee_id), GREATEST(requester_id, addressee_id))`
- `friendships_not_self`: `CHECK ((requester_id <> addressee_id))`

### goals

Meta con apuesta ("William"). Los datos propios de cada tipo viven en `goal_*_settings`.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
| --- | --- | --- | --- | --- | --- |
| `id` | `uuid` | no | `gen_random_uuid()` | PK | Identificador de la meta. |
| `owner_id` | `uuid` | no |  | FK → `users` (cascade) | Usuario que la creó. |
| `kind` | `goal_kind` | no |  |  | Tipo de meta; decide qué tabla de configuración la acompaña. |
| `title` | `varchar(80)` | no |  |  | Nombre de la meta. |
| `description` | `text` | sí |  |  | Texto libre opcional. |
| `status` | `goal_status` | no | `'active'::goal_status` |  | Ciclo de vida: activa, en pausa, completada, fallada o cancelada. |
| `stake_amount` | `numeric(18,6)` | no |  |  | Monto que apuesta cada participante. |
| `currency` | `varchar(10)` | no | `'USDC'::character varying` |  | Moneda de la apuesta. |
| `start_date` | `date` | no | `CURRENT_DATE` |  | Primer día en que aplica. |
| `end_date` | `date` | no |  |  | Último día en que aplica; al pasar se completa y libera la apuesta. |
| `repeat_days` | `int2[]` | no | `'{0,1,2,3,4,5,6}'::smallint[]` |  | Días de la semana en que aplica (0 = domingo … 6 = sábado). |
| `notifications_enabled` | `boolean` | no | `true` |  | Si la meta genera recordatorios. |
| `max_attempts` | `smallint` | no | `1` |  | Fallos tolerados; al alcanzarlos el participante pierde su apuesta. |
| `extra_lock_days` | `smallint` | no | `7` |  | Días que la apuesta perdida queda bloqueada. |
| `dev_tip_percent` | `numeric(5,2)` | no | `0` |  | Porcentaje de la apuesta perdida que va como propina al desarrollador. |
| `is_group` | `boolean` | no | `false` |  | Tiene invitados además del dueño. |
| `group_mode` | `group_mode` | sí |  |  | `vs`: quien falla paga a los demás. `coop`: cada uno arriesga solo lo suyo. |
| `escrow_tx_hash` | `varchar(66)` | sí |  |  | Transacción que bloqueó la apuesta (simulada mientras no haya contrato). |
| `resolved_at` | `timestamptz` | sí |  |  | Momento en que la meta se cerró. |
| `created_at` | `timestamptz` | no | `now()` |  | Creación de la meta. |
| `updated_at` | `timestamptz` | no | `now()` |  | Última modificación. |

Reglas:

- `goals_attempts_range`: `CHECK (((max_attempts >= 1) AND (max_attempts <= 10)))`
- `goals_dates_ordered`: `CHECK ((end_date >= start_date))`
- `goals_group_mode_consistent`: `CHECK (((is_group AND (group_mode IS NOT NULL)) OR ((NOT is_group) AND (group_mode IS NULL))))`
- `goals_lock_days_range`: `CHECK (((extra_lock_days >= 0) AND (extra_lock_days <= 365)))`
- `goals_repeat_days_valid`: `CHECK (((repeat_days <@ ARRAY[(0)::smallint, (1)::smallint, (2)::smallint, (3)::smallint, (4)::smallint, (5)::smallint, (6)::smallint]) AND (cardinality(repeat_days) > 0)))`
- `goals_stake_positive`: `CHECK ((stake_amount > (0)::numeric))`
- `goals_tip_range`: `CHECK (((dev_tip_percent >= (0)::numeric) AND (dev_tip_percent <= (100)::numeric)))`

### goal_alarm_settings

Configuración de una meta de alarma (1:1 con `goals`).

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
| --- | --- | --- | --- | --- | --- |
| `goal_id` | `uuid` | no |  | PK, FK → `goals` (cascade) | Meta a la que pertenece. |
| `target_time` | `time` | no |  |  | Hora local a la que suena. |
| `reaction_seconds` | `smallint` | no | `60` |  | Segundos que tiene el usuario para marcar que despertó. |
| `sound_title` | `varchar(80)` | sí |  |  | Nombre del sonido elegido. |
| `sound_uri` | `text` | sí |  |  | URI del sonido (reservado para música de terceros, RF-10). |
| `vibration_enabled` | `boolean` | no | `true` |  | Vibrar mientras suena. |

Reglas:

- `goal_alarm_reaction_range`: `CHECK (((reaction_seconds >= 10) AND (reaction_seconds <= 900)))`

### goal_app_timer_settings

Configuración de una meta de límite de uso de una app (1:1 con `goals`).

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
| --- | --- | --- | --- | --- | --- |
| `goal_id` | `uuid` | no |  | PK, FK → `goals` (cascade) | Meta a la que pertenece. |
| `app_package` | `varchar(160)` | no |  |  | Paquete Android de la app vigilada. |
| `app_name` | `varchar(80)` | no |  |  | Nombre visible de la app. |
| `max_daily_minutes` | `smallint` | no |  |  | Minutos en primer plano permitidos por día. |

Reglas:

- `goal_app_timer_minutes_range`: `CHECK (((max_daily_minutes >= 1) AND (max_daily_minutes <= 1440)))`

### goal_location_settings

Configuración de una meta de llegar a un lugar (1:1 con `goals`).

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
| --- | --- | --- | --- | --- | --- |
| `goal_id` | `uuid` | no |  | PK, FK → `goals` (cascade) | Meta a la que pertenece. |
| `place_label` | `varchar(120)` | no |  |  | Nombre del lugar. |
| `latitude` | `double precision` | no |  |  | Latitud del punto. |
| `longitude` | `double precision` | no |  |  | Longitud del punto. |
| `radius_m` | `integer` | no | `150` |  | Radio, en metros, dentro del cual cuenta como llegada. |
| `arrive_by` | `time` | no |  |  | Hora local límite para llegar. |

Reglas:

- `goal_location_lat_range`: `CHECK (((latitude >= ('-90'::integer)::double precision) AND (latitude <= (90)::double precision)))`
- `goal_location_lng_range`: `CHECK (((longitude >= ('-180'::integer)::double precision) AND (longitude <= (180)::double precision)))`
- `goal_location_radius_range`: `CHECK (((radius_m >= 25) AND (radius_m <= 5000)))`

### goal_ai_settings

Configuración de una meta no medible, juzgada con evidencias (1:1 con `goals`).

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
| --- | --- | --- | --- | --- | --- |
| `goal_id` | `uuid` | no |  | PK, FK → `goals` (cascade) | Meta a la que pertenece. |
| `prompt` | `text` | no |  |  | Qué debe mostrar la evidencia para darse por cumplida. |
| `verifier` | `goal_verifier` | no | `'ai'::goal_verifier` |  | Quién juzga: la IA o un amigo. |
| `verifier_user_id` | `uuid` | sí |  | FK → `users` (set null) | Amigo juez cuando `verifier = friend`. NULL si borró su cuenta (vuelve a decidir la IA). |

### goal_participants

Quién juega cada meta y cuánto tiene aún en custodia.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
| --- | --- | --- | --- | --- | --- |
| `goal_id` | `uuid` | no |  | PK, FK → `goals` (cascade) | Meta. |
| `user_id` | `uuid` | no |  | PK, FK → `users` (cascade) | Participante. |
| `role` | `participant_role` | no | `'participant'::participant_role` |  | Dueño, invitado o juez. |
| `status` | `participant_status` | no | `'invited'::participant_status` |  | Respuesta a la invitación. |
| `stake_amount` | `numeric(18,6)` | no | `0` |  | Apuesta que sigue en custodia; pasa a 0 al perderla o recuperarla. |
| `invited_at` | `timestamptz` | no | `now()` |  | Momento de la invitación. |
| `responded_at` | `timestamptz` | sí |  |  | Momento de la respuesta. |

Reglas:

- `goal_participants_stake_non_negative`: `CHECK ((stake_amount >= (0)::numeric))`

### goal_checkins

Veredicto de una meta para un usuario en un día. Es el historial de cumplimiento.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
| --- | --- | --- | --- | --- | --- |
| `id` | `uuid` | no | `gen_random_uuid()` | PK | Identificador del control. |
| `goal_id` | `uuid` | no |  | FK → `goals` (cascade) | Meta controlada. |
| `user_id` | `uuid` | no |  | FK → `users` (cascade) | Participante controlado. |
| `scheduled_for` | `date` | no |  |  | Día local al que corresponde el control. |
| `occurred_at` | `timestamptz` | no | `now()` |  | Momento en que se registró o resolvió. |
| `result` | `checkin_result` | no |  |  | Superado, fallado o pendiente de veredicto. |
| `source` | `checkin_source` | no |  |  | De dónde salió la medición: alarma, uso de apps, ubicación, evidencia o manual. |
| `measured_value` | `numeric(12,2)` | sí |  |  | Valor medido (segundos de reacción, minutos de uso, metros al punto). |
| `measured_unit` | `varchar(16)` | sí |  |  | Unidad del valor medido. |
| `latitude` | `double precision` | sí |  |  | Latitud reportada en un control de ubicación. |
| `longitude` | `double precision` | sí |  |  | Longitud reportada en un control de ubicación. |
| `details` | `jsonb` | no | `'{}'::jsonb` |  | Datos adicionales de la medición. |

Reglas:

- `goal_checkins_one_per_day`: único sobre `(goal_id, user_id, scheduled_for)`

### proofs

Evidencia fotográfica enviada para una meta juzgada.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
| --- | --- | --- | --- | --- | --- |
| `id` | `uuid` | no | `gen_random_uuid()` | PK | Identificador de la evidencia. |
| `goal_id` | `uuid` | no |  | FK → `goals` (cascade) | Meta a la que responde. |
| `user_id` | `uuid` | no |  | FK → `users` (cascade) | Quien la envió. |
| `checkin_id` | `uuid` | sí |  | FK → `goal_checkins` (set null) | Control del día que esta evidencia resuelve. |
| `media_url` | `text` | no |  |  | Ruta de la foto en el backend (`/uploads/proofs/...`). |
| `note` | `text` | sí |  |  | Nota del usuario para el juez. |
| `status` | `proof_status` | no | `'pending'::proof_status` |  | Pendiente, aprobada o rechazada. |
| `verifier` | `goal_verifier` | no | `'ai'::goal_verifier` |  | Quién debía juzgarla. |
| `reviewer_id` | `uuid` | sí |  | FK → `users` (set null) | Amigo que la juzga o juzgó. |
| `verdict_reason` | `text` | sí |  |  | Motivo del veredicto. |
| `created_at` | `timestamptz` | no | `now()` |  | Envío de la evidencia. |
| `reviewed_at` | `timestamptz` | sí |  |  | Momento del veredicto. |

### app_usage_samples

Minutos diarios en primer plano por app, leídos del teléfono (RF-11).

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
| --- | --- | --- | --- | --- | --- |
| `id` | `uuid` | no | `gen_random_uuid()` | PK | Identificador de la muestra. |
| `user_id` | `uuid` | no |  | FK → `users` (cascade) | Usuario medido. |
| `app_package` | `varchar(160)` | no |  |  | Paquete Android de la app. |
| `app_name` | `varchar(80)` | no |  |  | Nombre visible de la app. |
| `usage_date` | `date` | no |  |  | Día local medido. |
| `foreground_minutes` | `integer` | no |  |  | Minutos en primer plano ese día. |
| `updated_at` | `timestamptz` | no | `now()` |  | Última vez que el teléfono actualizó la muestra. |

Reglas:

- `app_usage_one_per_day`: único sobre `(user_id, app_package, usage_date)`
- `app_usage_minutes_range`: `CHECK (((foreground_minutes >= 0) AND (foreground_minutes <= 1440)))`

### wallet_transactions

Libro mayor: cada movimiento de dinero de un usuario. Los saldos se derivan de aquí.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
| --- | --- | --- | --- | --- | --- |
| `id` | `uuid` | no | `gen_random_uuid()` | PK | Identificador del movimiento. |
| `user_id` | `uuid` | no |  | FK → `users` (cascade) | Dueño del movimiento. |
| `goal_id` | `uuid` | sí |  | FK → `goals` (set null) | Meta relacionada, si la hay. |
| `type` | `tx_type` | no |  |  | Naturaleza del movimiento; determina su signo en los saldos. |
| `method` | `tx_method` | no | `'internal'::tx_method` |  | Vía: cripto, fiat (QR) o interno (custodia). |
| `amount` | `numeric(18,6)` | no |  |  | Monto, siempre positivo. |
| `currency` | `varchar(10)` | no | `'USDC'::character varying` |  | Moneda. |
| `status` | `tx_status` | no | `'confirmed'::tx_status` |  | Pendiente, confirmado o fallido. |
| `chain` | `varchar(32)` | sí |  |  | Red de la transacción on-chain. |
| `tx_hash` | `varchar(66)` | sí |  |  | Hash de la transacción (simulado por ahora). |
| `reference_code` | `varchar(16)` | no | `('WF-'::text \|\| upper(substr(md5((gen_random_uuid())::text), 1, 10)))` |  | Código del comprobante que ve el usuario (`WF-…`). |
| `note` | `varchar(160)` | sí |  |  | Concepto. |
| `created_at` | `timestamptz` | no | `now()` |  | Registro del movimiento. |
| `confirmed_at` | `timestamptz` | sí |  |  | Confirmación del movimiento. |

Reglas:

- `wallet_transactions_reference_code_key`: único sobre `(reference_code)`
- `wallet_transactions_amount_positive`: `CHECK ((amount > (0)::numeric))`

### notifications

Buzón de avisos del usuario (RF-13).

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
| --- | --- | --- | --- | --- | --- |
| `id` | `uuid` | no | `gen_random_uuid()` | PK | Identificador del aviso. |
| `user_id` | `uuid` | no |  | FK → `users` (cascade) | Destinatario. |
| `type` | `notification_type` | no | `'system'::notification_type` |  | Categoría del aviso. |
| `title` | `varchar(120)` | no |  |  | Título, ya redactado en el idioma del usuario. |
| `body` | `text` | no | `''::text` |  | Texto del aviso. |
| `data` | `jsonb` | no | `'{}'::jsonb` |  | Referencias para navegar al tocarlo (`goalId`, `userId`, `proofId`, `transactionId`). |
| `read_at` | `timestamptz` | sí |  |  | Momento en que se leyó. NULL = sin leer. |
| `created_at` | `timestamptz` | no | `now()` |  | Creación del aviso. |

### pets

WillPet: la mascota que refleja la constancia del usuario.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
| --- | --- | --- | --- | --- | --- |
| `user_id` | `uuid` | no |  | PK, FK → `users` (cascade) | Dueño de la mascota. |
| `name` | `varchar(24)` | no | `'Will'::character varying` |  | Nombre de la mascota. |
| `mood` | `pet_mood` | no | `'idle'::pet_mood` |  | Estado de ánimo actual. |
| `energy` | `smallint` | no | `68` |  | Energía de 0 a 100; sube al cumplir, baja al fallar. |
| `streak` | `integer` | no | `0` |  | Controles superados seguidos; un fallo lo reinicia. |
| `best_streak` | `integer` | no | `0` |  | Mejor racha histórica. |
| `last_fed_at` | `timestamptz` | sí |  |  | Última vez que la alimentaron. |
| `updated_at` | `timestamptz` | no | `now()` |  | Última modificación. |

Reglas:

- `pets_energy_range`: `CHECK (((energy >= 0) AND (energy <= 100)))`
- `pets_streak_non_negative`: `CHECK (((streak >= 0) AND (best_streak >= 0)))`

## Tipos enumerados

| Tipo | Valores | Significado |
| --- | --- | --- |
| `auth_provider` | `dev`, `google`, `facebook`, `twitter` | Proveedor de autenticación. |
| `checkin_result` | `pending`, `success`, `fail` | Veredicto de un control. |
| `checkin_source` | `alarm`, `usage`, `location`, `proof`, `manual` | Origen de la medición de un control. |
| `device_platform` | `android`, `ios`, `web` | Sistema operativo del dispositivo. |
| `friendship_status` | `pending`, `accepted`, `declined`, `blocked` | Estado de una solicitud de amistad. |
| `goal_kind` | `alarm`, `app_timer`, `locator`, `ai` | Tipo de meta: alarma, límite de app, ubicación o juzgada por evidencia. |
| `goal_status` | `draft`, `active`, `paused`, `completed`, `failed`, `cancelled` | Ciclo de vida de una meta. |
| `goal_verifier` | `ai`, `friend` | Quién juzga una evidencia. |
| `group_mode` | `coop`, `vs` | Reparto del riesgo en metas compartidas. |
| `location_access` | `none`, `foreground`, `background` | Alcance del permiso de ubicación. |
| `notification_type` | `system`, `goal_created`, `goal_invite`, `goal_result`, `friend_request`, `friend_accepted`, `proof_review`, `wallet` | Categoría de un aviso. |
| `participant_role` | `owner`, `participant`, `judge` | Papel de un usuario en una meta. |
| `participant_status` | `invited`, `accepted`, `declined`, `left` | Respuesta a la invitación a una meta. |
| `pet_mood` | `idle`, `happy`, `sad` | Ánimo de la mascota. |
| `proof_status` | `pending`, `approved`, `rejected` | Estado de una evidencia. |
| `theme_id` | `acid`, `void` | Paleta de la interfaz. |
| `tx_method` | `crypto`, `fiat`, `internal` | Vía de un movimiento. |
| `tx_status` | `pending`, `confirmed`, `failed` | Estado de un movimiento. |
| `tx_type` | `deposit`, `withdrawal`, `stake_lock`, `stake_release`, `penalty`, `reward`, `donation` | Naturaleza de un movimiento de billetera. |

## Vistas

### v_user_balances

Saldos de cada usuario derivados de `wallet_transactions`.

| Columna | Cálculo |
| --- | --- |
| `user_id` | Usuario. |
| `available` | `deposit` + `stake_release` + `reward` confirmados, menos `withdrawal` y `stake_lock` no fallidos. |
| `in_escrow` | `stake_lock` menos `stake_release`, `penalty` y `donation` (confirmados). |
| `penalized` | `penalty` + `donation` confirmados: lo perdido en metas falladas. |

### v_goal_progress

Conteo de controles por meta y participante.

| Columna | Cálculo |
| --- | --- |
| `goal_id`, `user_id` | Meta y participante. |
| `success_count` | Controles con `result = success`. |
| `fail_count` | Controles con `result = fail`; se compara con `goals.max_attempts`. |
| `pending_count` | Controles a la espera de veredicto. |
| `last_checkin_at` | Momento del control más reciente. |

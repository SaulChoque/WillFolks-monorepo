#!/usr/bin/env python3
"""Regenera docs/diccionario-de-datos.md a partir del catálogo de la base en ejecución.

Tipos, nulabilidad, valores por defecto y claves salen de PostgreSQL; las descripciones
se mantienen aquí. Uso: ./scripts/data-dictionary.py  (con el contenedor levantado).
"""
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

TABLES = {
    "users": ("Cuenta de una persona. Se crea en el primer inicio de sesión.", {
        "id": "Identificador de la cuenta.",
        "email": "Correo con el que inicia sesión. No distingue mayúsculas.",
        "username": "Alias público para que lo encuentren (3-24 letras, dígitos o `_`). Vacío hasta el onboarding.",
        "display_name": "Nombre que ven los demás.",
        "avatar_url": "Ruta de la foto de perfil subida al backend (`/uploads/avatars/...`).",
        "auth_provider": "Proveedor con el que se autenticó. `dev` es el login sin contraseña de desarrollo.",
        "provider_subject": "Identificador del usuario en ese proveedor.",
        "wallet_address": "Dirección EVM de la billetera generada en el teléfono.",
        "chain": "Red donde vive la custodia de sus apuestas.",
        "location_label": "Ciudad o lugar que muestra en su perfil.",
        "timezone": "Zona horaria IANA; alimenta la pestaña de horas de amigos.",
        "locale": "Idioma de la app (`en`/`es`); las notificaciones se redactan en él.",
        "onboarding_completed_at": "Momento en que terminó el onboarding. NULL = aún debe completarlo.",
        "created_at": "Alta de la cuenta.",
        "updated_at": "Última modificación (lo mantiene un trigger).",
        "deleted_at": "Reservado para borrado lógico; hoy el borrado es físico.",
    }),
    "user_settings": ("Preferencias de la app, una fila por usuario.", {
        "user_id": "Usuario dueño de las preferencias.",
        "theme": "Paleta de la interfaz: `acid` (verde) o `void` (oscura).",
        "haptics": "Vibración corta al tocar controles.",
        "show_seconds": "Mostrar segundos en el reloj de la pestaña Tiempo.",
        "reminders": "Programar recordatorios locales de las metas.",
        "vibration": "Vibrar mientras suena una alarma.",
        "updated_at": "Última modificación.",
    }),
    "devices": ("Instalaciones de la app y permisos nativos que tienen concedidos.", {
        "id": "Identificador del registro.",
        "user_id": "Usuario que usa el dispositivo.",
        "install_id": "Identificador aleatorio de la instalación, generado en el teléfono.",
        "platform": "Sistema operativo.",
        "model": "Modelo del teléfono.",
        "os_version": "Versión del sistema operativo.",
        "app_version": "Versión de la app.",
        "notifications_granted": "Puede publicar notificaciones.",
        "exact_alarm_granted": "Puede programar alarmas exactas.",
        "usage_access_granted": "Tiene acceso al uso de apps (UsageStatsManager).",
        "camera_granted": "Puede usar la cámara.",
        "location_access": "Alcance del permiso de ubicación.",
        "last_seen_at": "Última vez que la app reportó este dispositivo.",
        "created_at": "Primer reporte del dispositivo.",
    }),
    "friendships": ("Relación entre dos usuarios; una sola fila por pareja.", {
        "id": "Identificador de la relación.",
        "requester_id": "Quien envió la solicitud.",
        "addressee_id": "Quien la recibió.",
        "status": "Estado de la solicitud.",
        "created_at": "Envío de la solicitud.",
        "responded_at": "Momento en que se aceptó o rechazó.",
    }),
    "goals": ("Meta con apuesta (\"William\"). Los datos propios de cada tipo viven en `goal_*_settings`.", {
        "id": "Identificador de la meta.",
        "owner_id": "Usuario que la creó.",
        "kind": "Tipo de meta; decide qué tabla de configuración la acompaña.",
        "title": "Nombre de la meta.",
        "description": "Texto libre opcional.",
        "status": "Ciclo de vida: activa, en pausa, completada, fallada o cancelada.",
        "stake_amount": "Monto que apuesta cada participante.",
        "currency": "Moneda de la apuesta.",
        "start_date": "Primer día en que aplica.",
        "end_date": "Último día en que aplica; al pasar se completa y libera la apuesta.",
        "repeat_days": "Días de la semana en que aplica (0 = domingo … 6 = sábado).",
        "notifications_enabled": "Si la meta genera recordatorios.",
        "max_attempts": "Fallos tolerados; al alcanzarlos el participante pierde su apuesta.",
        "extra_lock_days": "Días que la apuesta perdida queda bloqueada.",
        "dev_tip_percent": "Porcentaje de la apuesta perdida que va como propina al desarrollador.",
        "is_group": "Tiene invitados además del dueño.",
        "group_mode": "`vs`: quien falla paga a los demás. `coop`: cada uno arriesga solo lo suyo.",
        "escrow_tx_hash": "Transacción que bloqueó la apuesta (simulada mientras no haya contrato).",
        "resolved_at": "Momento en que la meta se cerró.",
        "created_at": "Creación de la meta.",
        "updated_at": "Última modificación.",
    }),
    "goal_alarm_settings": ("Configuración de una meta de alarma (1:1 con `goals`).", {
        "goal_id": "Meta a la que pertenece.",
        "target_time": "Hora local a la que suena.",
        "reaction_seconds": "Segundos que tiene el usuario para marcar que despertó.",
        "sound_title": "Nombre del sonido elegido.",
        "sound_uri": "URI del sonido (reservado para música de terceros, RF-10).",
        "vibration_enabled": "Vibrar mientras suena.",
    }),
    "goal_app_timer_settings": ("Configuración de una meta de límite de uso de una app (1:1 con `goals`).", {
        "goal_id": "Meta a la que pertenece.",
        "app_package": "Paquete Android de la app vigilada.",
        "app_name": "Nombre visible de la app.",
        "max_daily_minutes": "Minutos en primer plano permitidos por día.",
    }),
    "goal_location_settings": ("Configuración de una meta de llegar a un lugar (1:1 con `goals`).", {
        "goal_id": "Meta a la que pertenece.",
        "place_label": "Nombre del lugar.",
        "latitude": "Latitud del punto.",
        "longitude": "Longitud del punto.",
        "radius_m": "Radio, en metros, dentro del cual cuenta como llegada.",
        "arrive_by": "Hora local límite para llegar.",
    }),
    "goal_ai_settings": ("Configuración de una meta no medible, juzgada con evidencias (1:1 con `goals`).", {
        "goal_id": "Meta a la que pertenece.",
        "prompt": "Qué debe mostrar la evidencia para darse por cumplida.",
        "verifier": "Quién juzga: la IA o un amigo.",
        "verifier_user_id": "Amigo juez cuando `verifier = friend`. NULL si borró su cuenta (vuelve a decidir la IA).",
    }),
    "goal_participants": ("Quién juega cada meta y cuánto tiene aún en custodia.", {
        "goal_id": "Meta.",
        "user_id": "Participante.",
        "role": "Dueño, invitado o juez.",
        "status": "Respuesta a la invitación.",
        "stake_amount": "Apuesta que sigue en custodia; pasa a 0 al perderla o recuperarla.",
        "invited_at": "Momento de la invitación.",
        "responded_at": "Momento de la respuesta.",
    }),
    "goal_checkins": ("Veredicto de una meta para un usuario en un día. Es el historial de cumplimiento.", {
        "id": "Identificador del control.",
        "goal_id": "Meta controlada.",
        "user_id": "Participante controlado.",
        "scheduled_for": "Día local al que corresponde el control.",
        "occurred_at": "Momento en que se registró o resolvió.",
        "result": "Superado, fallado o pendiente de veredicto.",
        "source": "De dónde salió la medición: alarma, uso de apps, ubicación, evidencia o manual.",
        "measured_value": "Valor medido (segundos de reacción, minutos de uso, metros al punto).",
        "measured_unit": "Unidad del valor medido.",
        "latitude": "Latitud reportada en un control de ubicación.",
        "longitude": "Longitud reportada en un control de ubicación.",
        "details": "Datos adicionales de la medición.",
    }),
    "proofs": ("Evidencia fotográfica enviada para una meta juzgada.", {
        "id": "Identificador de la evidencia.",
        "goal_id": "Meta a la que responde.",
        "user_id": "Quien la envió.",
        "checkin_id": "Control del día que esta evidencia resuelve.",
        "media_url": "Ruta de la foto en el backend (`/uploads/proofs/...`).",
        "note": "Nota del usuario para el juez.",
        "status": "Pendiente, aprobada o rechazada.",
        "verifier": "Quién debía juzgarla.",
        "reviewer_id": "Amigo que la juzga o juzgó.",
        "verdict_reason": "Motivo del veredicto.",
        "created_at": "Envío de la evidencia.",
        "reviewed_at": "Momento del veredicto.",
    }),
    "app_usage_samples": ("Minutos diarios en primer plano por app, leídos del teléfono (RF-11).", {
        "id": "Identificador de la muestra.",
        "user_id": "Usuario medido.",
        "app_package": "Paquete Android de la app.",
        "app_name": "Nombre visible de la app.",
        "usage_date": "Día local medido.",
        "foreground_minutes": "Minutos en primer plano ese día.",
        "updated_at": "Última vez que el teléfono actualizó la muestra.",
    }),
    "wallet_transactions": ("Libro mayor: cada movimiento de dinero de un usuario. Los saldos se derivan de aquí.", {
        "id": "Identificador del movimiento.",
        "user_id": "Dueño del movimiento.",
        "goal_id": "Meta relacionada, si la hay.",
        "type": "Naturaleza del movimiento; determina su signo en los saldos.",
        "method": "Vía: cripto, fiat (QR) o interno (custodia).",
        "amount": "Monto, siempre positivo.",
        "currency": "Moneda.",
        "status": "Pendiente, confirmado o fallido.",
        "chain": "Red de la transacción on-chain.",
        "tx_hash": "Hash de la transacción (simulado por ahora).",
        "reference_code": "Código del comprobante que ve el usuario (`WF-…`).",
        "note": "Concepto.",
        "created_at": "Registro del movimiento.",
        "confirmed_at": "Confirmación del movimiento.",
    }),
    "notifications": ("Buzón de avisos del usuario (RF-13).", {
        "id": "Identificador del aviso.",
        "user_id": "Destinatario.",
        "type": "Categoría del aviso.",
        "title": "Título, ya redactado en el idioma del usuario.",
        "body": "Texto del aviso.",
        "data": "Referencias para navegar al tocarlo (`goalId`, `userId`, `proofId`, `transactionId`).",
        "read_at": "Momento en que se leyó. NULL = sin leer.",
        "created_at": "Creación del aviso.",
    }),
    "pets": ("WillPet: la mascota que refleja la constancia del usuario.", {
        "user_id": "Dueño de la mascota.",
        "name": "Nombre de la mascota.",
        "mood": "Estado de ánimo actual.",
        "energy": "Energía de 0 a 100; sube al cumplir, baja al fallar.",
        "streak": "Controles superados seguidos; un fallo lo reinicia.",
        "best_streak": "Mejor racha histórica.",
        "last_fed_at": "Última vez que la alimentaron.",
        "updated_at": "Última modificación.",
    }),
}

ENUMS = {
    "auth_provider": "Proveedor de autenticación.",
    "theme_id": "Paleta de la interfaz.",
    "device_platform": "Sistema operativo del dispositivo.",
    "location_access": "Alcance del permiso de ubicación.",
    "friendship_status": "Estado de una solicitud de amistad.",
    "goal_kind": "Tipo de meta: alarma, límite de app, ubicación o juzgada por evidencia.",
    "goal_status": "Ciclo de vida de una meta.",
    "group_mode": "Reparto del riesgo en metas compartidas.",
    "goal_verifier": "Quién juzga una evidencia.",
    "participant_role": "Papel de un usuario en una meta.",
    "participant_status": "Respuesta a la invitación a una meta.",
    "checkin_result": "Veredicto de un control.",
    "checkin_source": "Origen de la medición de un control.",
    "proof_status": "Estado de una evidencia.",
    "tx_type": "Naturaleza de un movimiento de billetera.",
    "tx_method": "Vía de un movimiento.",
    "tx_status": "Estado de un movimiento.",
    "notification_type": "Categoría de un aviso.",
    "pet_mood": "Ánimo de la mascota.",
}


def query(sql: str) -> list[list[str]]:
    out = subprocess.run(
        ["docker", "compose", "exec", "-T", "postgres", "psql", "-U", "willfolks", "-d", "willfolks", "-AtF", "\t", "-c", sql],
        cwd=ROOT, check=True, capture_output=True, text=True,
    ).stdout
    return [line.split("\t") for line in out.splitlines() if line]


COLUMNS = """
SELECT c.table_name, c.column_name,
       CASE WHEN c.data_type = 'USER-DEFINED' THEN c.udt_name
            WHEN c.data_type = 'ARRAY' THEN substr(c.udt_name, 2) || '[]'
            WHEN c.character_maximum_length IS NOT NULL THEN 'varchar(' || c.character_maximum_length || ')'
            WHEN c.data_type = 'numeric' THEN 'numeric(' || c.numeric_precision || ',' || c.numeric_scale || ')'
            WHEN c.data_type = 'timestamp with time zone' THEN 'timestamptz'
            WHEN c.data_type = 'time without time zone' THEN 'time'
            ELSE c.data_type END,
       c.is_nullable, COALESCE(c.column_default, '')
  FROM information_schema.columns c
  JOIN information_schema.tables t USING (table_schema, table_name)
 WHERE c.table_schema = 'public' AND t.table_type = 'BASE TABLE'
 ORDER BY c.table_name, c.ordinal_position"""

KEYS = """
SELECT tc.table_name, kcu.column_name, tc.constraint_type, COALESCE(ccu.table_name, ''), COALESCE(rc.delete_rule, '')
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu USING (constraint_schema, constraint_name)
  LEFT JOIN information_schema.referential_constraints rc USING (constraint_schema, constraint_name)
  LEFT JOIN information_schema.constraint_column_usage ccu
         ON tc.constraint_type = 'FOREIGN KEY' AND ccu.constraint_name = tc.constraint_name
 WHERE tc.table_schema = 'public' AND tc.constraint_type IN ('PRIMARY KEY', 'FOREIGN KEY')"""

CHECKS = """
SELECT rel.relname, con.conname, pg_get_constraintdef(con.oid)
  FROM pg_constraint con JOIN pg_class rel ON rel.oid = con.conrelid
 WHERE con.contype = 'c' AND rel.relnamespace = 'public'::regnamespace
 ORDER BY rel.relname, con.conname"""

UNIQUES = """
SELECT tablename, indexname, regexp_replace(indexdef, '^.* USING btree ', '')
  FROM pg_indexes
 WHERE schemaname = 'public' AND indexdef LIKE 'CREATE UNIQUE%' AND indexname NOT LIKE '%_pkey'
 ORDER BY tablename, indexname"""

ENUM_VALUES = """
SELECT t.typname, string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder)
  FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid
 GROUP BY t.typname ORDER BY t.typname"""


def main() -> None:
    keys: dict[tuple[str, str], list[str]] = {}
    for table, column, kind, target, rule in query(KEYS):
        label = "PK" if kind == "PRIMARY KEY" else f"FK → `{target}`" + (f" ({rule.lower()})" if rule else "")
        keys.setdefault((table, column), []).append(label)

    columns: dict[str, list[list[str]]] = {}
    for row in query(COLUMNS):
        columns.setdefault(row[0], []).append(row + [""] * (5 - len(row)))
    checks: dict[str, list[str]] = {}
    for table, name, definition in query(CHECKS):
        checks.setdefault(table, []).append(f"`{name}`: `{definition}`")
    uniques: dict[str, list[str]] = {}
    for table, name, definition in query(UNIQUES):
        uniques.setdefault(table, []).append(f"`{name}`: único sobre `{definition}`")

    missing = [f"{t}.{c[1]}" for t, rows in columns.items() for c in rows if c[1] not in TABLES.get(t, ("", {}))[1]]
    if missing:
        raise SystemExit(f"Faltan descripciones para: {', '.join(missing)}")

    lines = [
        "# Diccionario de datos · WillFolks",
        "",
        "> Generado por `scripts/data-dictionary.py` desde el catálogo de PostgreSQL. No editar a mano:",
        "> cambia `sql/01_schema.sql` (o las descripciones del script) y vuelve a generarlo.",
        "",
        "Convenciones: todas las claves primarias son `uuid`; las fechas con hora son `timestamptz` (UTC);",
        "los montos son `numeric(18,6)` y siempre positivos.",
        "",
        "## Tablas",
        "",
    ]
    lines += [f"- [`{table}`](#{table}) — {TABLES[table][0]}" for table in TABLES]
    for table, (summary, descriptions) in TABLES.items():
        lines += ["", f"### {table}", "", summary, "", "| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |", "| --- | --- | --- | --- | --- | --- |"]
        for _, column, kind, nullable, default in columns[table]:
            default = f"`{default.replace('|', chr(92) + '|')}`" if default else ""
            key = ", ".join(keys.get((table, column), []))
            lines.append(f"| `{column}` | `{kind}` | {'sí' if nullable == 'YES' else 'no'} | {default} | {key} | {descriptions[column]} |")
        rules = uniques.get(table, []) + checks.get(table, [])
        if rules:
            lines += ["", "Reglas:", ""] + [f"- {rule}" for rule in rules]

    lines += ["", "## Tipos enumerados", "", "| Tipo | Valores | Significado |", "| --- | --- | --- |"]
    lines += [f"| `{name}` | {', '.join(f'`{v}`' for v in values.split(', '))} | {ENUMS[name]} |" for name, values in query(ENUM_VALUES)]

    lines += [
        "",
        "## Vistas",
        "",
        "### v_user_balances",
        "",
        "Saldos de cada usuario derivados de `wallet_transactions`.",
        "",
        "| Columna | Cálculo |",
        "| --- | --- |",
        "| `user_id` | Usuario. |",
        "| `available` | `deposit` + `stake_release` + `reward` confirmados, menos `withdrawal` y `stake_lock` no fallidos. |",
        "| `in_escrow` | `stake_lock` menos `stake_release`, `penalty` y `donation` (confirmados). |",
        "| `penalized` | `penalty` + `donation` confirmados: lo perdido en metas falladas. |",
        "",
        "### v_goal_progress",
        "",
        "Conteo de controles por meta y participante.",
        "",
        "| Columna | Cálculo |",
        "| --- | --- |",
        "| `goal_id`, `user_id` | Meta y participante. |",
        "| `success_count` | Controles con `result = success`. |",
        "| `fail_count` | Controles con `result = fail`; se compara con `goals.max_attempts`. |",
        "| `pending_count` | Controles a la espera de veredicto. |",
        "| `last_checkin_at` | Momento del control más reciente. |",
        "",
    ]
    (ROOT / "docs" / "diccionario-de-datos.md").write_text("\n".join(lines), encoding="utf-8")
    print(f"docs/diccionario-de-datos.md: {len(TABLES)} tablas, {sum(len(c) for c in columns.values())} columnas")


if __name__ == "__main__":
    main()

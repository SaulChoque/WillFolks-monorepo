# Modelo entidad-relación · WillFolks

Diagrama en Mermaid (GitHub, VS Code y la mayoría de visores de Markdown lo renderizan).
El detalle de cada columna está en el [diccionario de datos](diccionario-de-datos.md) y el
mismo modelo en formato DBML en [`willfolks.dbml`](willfolks.dbml).

```mermaid
erDiagram
    users ||--|| user_settings : "tiene"
    users ||--|| pets : "cuida"
    users ||--o{ devices : "usa"
    users ||--o{ friendships : "solicita / recibe"
    users ||--o{ goals : "crea"
    users ||--o{ goal_participants : "participa"
    users ||--o{ goal_checkins : "es controlado"
    users ||--o{ proofs : "envía / juzga"
    users ||--o{ app_usage_samples : "genera"
    users ||--o{ wallet_transactions : "mueve"
    users ||--o{ notifications : "recibe"

    goals ||--o| goal_alarm_settings : "kind = alarm"
    goals ||--o| goal_app_timer_settings : "kind = app_timer"
    goals ||--o| goal_location_settings : "kind = locator"
    goals ||--o| goal_ai_settings : "kind = ai"
    goals ||--|{ goal_participants : "la juegan"
    goals ||--o{ goal_checkins : "se controla"
    goals ||--o{ proofs : "recibe evidencias"
    goals ||--o{ wallet_transactions : "origina"
    goal_checkins ||--o{ proofs : "se resuelve con"

    users {
        uuid id PK
        citext email UK
        citext username UK
        varchar display_name
        varchar wallet_address
        timestamptz onboarding_completed_at
    }
    goals {
        uuid id PK
        uuid owner_id FK
        goal_kind kind
        goal_status status
        numeric stake_amount
        date start_date
        date end_date
        smallint_array repeat_days
        smallint max_attempts
        group_mode group_mode
    }
    goal_participants {
        uuid goal_id PK
        uuid user_id PK
        participant_role role
        participant_status status
        numeric stake_amount
    }
    goal_checkins {
        uuid id PK
        uuid goal_id FK
        uuid user_id FK
        date scheduled_for
        checkin_result result
        checkin_source source
    }
    proofs {
        uuid id PK
        uuid goal_id FK
        uuid checkin_id FK
        text media_url
        proof_status status
        uuid reviewer_id FK
    }
    wallet_transactions {
        uuid id PK
        uuid user_id FK
        uuid goal_id FK
        tx_type type
        numeric amount
        tx_status status
        varchar reference_code UK
    }
    friendships {
        uuid id PK
        uuid requester_id FK
        uuid addressee_id FK
        friendship_status status
    }
```

## Decisiones de diseño

| Decisión | Motivo |
| --- | --- |
| Una tabla `goals` y cuatro `goal_*_settings` 1:1 | Lo común (apuesta, fechas, días, intentos) se consulta igual para todos los tipos; lo específico queda tipado y con sus propios `CHECK`, sin columnas nulas ni un `jsonb` opaco. |
| Saldos derivados de `wallet_transactions` (vista `v_user_balances`) | No hay un saldo guardado que pueda desincronizarse: cada número se puede auditar sumando movimientos. |
| `amount` siempre positivo y el signo en `type` | Evita errores de signo y permite un `CHECK (amount > 0)` simple. |
| Único `(goal_id, user_id, scheduled_for)` en `goal_checkins` | Un veredicto por meta, usuario y día: reintentar desde el teléfono (sin red, doble toque) es idempotente. |
| `goal_participants.stake_amount` como "lo que sigue en custodia" | Al penalizar o liberar pasa a 0, así nunca se devuelve dos veces una apuesta. |
| Índice único sobre `LEAST/GREATEST` en `friendships` | Una sola fila por pareja sin importar quién envió la solicitud. |
| `ON DELETE CASCADE` desde `users` | Borrar la cuenta (RNF-30) elimina todo lo personal en una sola operación. |
| `verifier_user_id` con `ON DELETE SET NULL` y sin `CHECK` | Si el amigo juez borra su cuenta, la meta sigue viva y vuelve a juzgar la IA. |

## Estados

**Meta (`goal_status`)**

```mermaid
stateDiagram-v2
    [*] --> active: se crea y bloquea la apuesta
    active --> paused: el dueño la pausa
    paused --> active: la reanuda
    active --> failed: el dueño agota sus intentos
    active --> completed: pasa end_date (libera apuestas)
    paused --> completed: pasa end_date
    active --> cancelled: el dueño la cancela (libera apuestas)
    paused --> cancelled
```

**Dinero de una apuesta (`tx_type`)**

```mermaid
flowchart LR
    D[deposit] --> A((disponible))
    A -->|stake_lock| E((en custodia))
    E -->|stake_release: meta completada o cancelada| A
    E -->|penalty + donation: intentos agotados| P((penalizado))
    P -.->|reward: modo vs, a los rivales| A2((disponible del rival))
    A -->|withdrawal| W[fuera]
```

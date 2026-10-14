-- =============================================================================
-- WillFolks · esquema de base de datos (PostgreSQL 16)
-- -----------------------------------------------------------------------------
-- Fuente de verdad del modelo relacional. El backend (willfolks-BE) NO sincroniza
-- el esquema: mapea sus entidades sobre estas tablas tal cual están aquí.
-- Se ejecuta automáticamente al crear el contenedor (docker-entrypoint-initdb.d).
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS citext;

-- ----------------------------------------------------------------------------
-- Tipos enumerados
-- ----------------------------------------------------------------------------
CREATE TYPE auth_provider      AS ENUM ('dev', 'google', 'facebook', 'twitter');
CREATE TYPE theme_id           AS ENUM ('acid', 'void');
CREATE TYPE device_platform    AS ENUM ('android', 'ios', 'web');
CREATE TYPE location_access    AS ENUM ('none', 'foreground', 'background');
CREATE TYPE friendship_status  AS ENUM ('pending', 'accepted', 'declined', 'blocked');
CREATE TYPE goal_kind          AS ENUM ('alarm', 'app_timer', 'locator', 'ai');
CREATE TYPE goal_status        AS ENUM ('draft', 'active', 'paused', 'completed', 'failed', 'cancelled');
CREATE TYPE group_mode         AS ENUM ('coop', 'vs');
CREATE TYPE goal_verifier      AS ENUM ('ai', 'friend');
CREATE TYPE participant_role   AS ENUM ('owner', 'participant', 'judge');
CREATE TYPE participant_status AS ENUM ('invited', 'accepted', 'declined', 'left');
CREATE TYPE checkin_result     AS ENUM ('pending', 'success', 'fail');
CREATE TYPE checkin_source     AS ENUM ('alarm', 'usage', 'location', 'proof', 'manual');
CREATE TYPE proof_status       AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE tx_type            AS ENUM ('deposit', 'withdrawal', 'stake_lock', 'stake_release', 'penalty', 'reward', 'donation');
CREATE TYPE tx_method          AS ENUM ('crypto', 'fiat', 'internal');
CREATE TYPE tx_status          AS ENUM ('pending', 'confirmed', 'failed');
CREATE TYPE notification_type  AS ENUM ('system', 'goal_created', 'goal_invite', 'goal_result', 'friend_request',
                                        'friend_accepted', 'proof_review', 'wallet');
CREATE TYPE pet_mood           AS ENUM ('idle', 'happy', 'sad');

-- ----------------------------------------------------------------------------
-- Utilidades
-- ----------------------------------------------------------------------------
CREATE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- ----------------------------------------------------------------------------
-- Usuarios, ajustes y dispositivos                              (RF-01..RF-04)
-- ----------------------------------------------------------------------------
CREATE TABLE users (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email                   citext       NOT NULL UNIQUE,
  username                citext       UNIQUE,
  display_name            varchar(60)  NOT NULL,
  avatar_url              text,
  auth_provider           auth_provider NOT NULL DEFAULT 'dev',
  provider_subject        varchar(255),
  wallet_address          varchar(42),
  chain                   varchar(32)  NOT NULL DEFAULT 'avalanche-fuji',
  location_label          varchar(120),
  timezone                varchar(64)  NOT NULL DEFAULT 'UTC',
  locale                  varchar(10)  NOT NULL DEFAULT 'en',
  onboarding_completed_at timestamptz,
  created_at              timestamptz  NOT NULL DEFAULT now(),
  updated_at              timestamptz  NOT NULL DEFAULT now(),
  deleted_at              timestamptz,
  CONSTRAINT users_username_format CHECK (username IS NULL OR username ~ '^[a-zA-Z0-9_]{3,24}$'),
  CONSTRAINT users_wallet_format   CHECK (wallet_address IS NULL OR wallet_address ~ '^0x[0-9a-fA-F]{40}$'),
  CONSTRAINT users_provider_subject_unique UNIQUE (auth_provider, provider_subject)
);
CREATE TRIGGER users_set_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE user_settings (
  user_id      uuid PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  theme        theme_id    NOT NULL DEFAULT 'acid',
  haptics      boolean     NOT NULL DEFAULT true,
  show_seconds boolean     NOT NULL DEFAULT true,
  reminders    boolean     NOT NULL DEFAULT true,
  vibration    boolean     NOT NULL DEFAULT true,
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER user_settings_set_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE devices (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  install_id            varchar(64)     NOT NULL,
  platform              device_platform NOT NULL DEFAULT 'android',
  model                 varchar(80),
  os_version            varchar(40),
  app_version           varchar(20),
  notifications_granted boolean         NOT NULL DEFAULT false,
  exact_alarm_granted   boolean         NOT NULL DEFAULT false,
  usage_access_granted  boolean         NOT NULL DEFAULT false,
  camera_granted        boolean         NOT NULL DEFAULT false,
  location_access       location_access NOT NULL DEFAULT 'none',
  last_seen_at          timestamptz     NOT NULL DEFAULT now(),
  created_at            timestamptz     NOT NULL DEFAULT now(),
  CONSTRAINT devices_user_install_unique UNIQUE (user_id, install_id)
);

-- ----------------------------------------------------------------------------
-- Amistades                                                            (RF-05)
-- ----------------------------------------------------------------------------
CREATE TABLE friendships (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  addressee_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  status       friendship_status NOT NULL DEFAULT 'pending',
  created_at   timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  CONSTRAINT friendships_not_self CHECK (requester_id <> addressee_id)
);
-- Una sola relación por pareja, sin importar quién la pidió.
CREATE UNIQUE INDEX friendships_pair_unique
  ON friendships (LEAST(requester_id, addressee_id), GREATEST(requester_id, addressee_id));
CREATE INDEX friendships_addressee_idx ON friendships (addressee_id, status);

-- ----------------------------------------------------------------------------
-- Metas ("Williams")                                  (RF-03, RF-06, RF-09)
-- ----------------------------------------------------------------------------
CREATE TABLE goals (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id              uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  kind                  goal_kind     NOT NULL,
  title                 varchar(80)   NOT NULL,
  description           text,
  status                goal_status   NOT NULL DEFAULT 'active',
  stake_amount          numeric(18,6) NOT NULL,
  currency              varchar(10)   NOT NULL DEFAULT 'USDC',
  start_date            date          NOT NULL DEFAULT CURRENT_DATE,
  end_date              date          NOT NULL,
  repeat_days           smallint[]    NOT NULL DEFAULT '{0,1,2,3,4,5,6}',
  notifications_enabled boolean       NOT NULL DEFAULT true,
  max_attempts          smallint      NOT NULL DEFAULT 1,
  extra_lock_days       smallint      NOT NULL DEFAULT 7,
  dev_tip_percent       numeric(5,2)  NOT NULL DEFAULT 0,
  is_group              boolean       NOT NULL DEFAULT false,
  group_mode            group_mode,
  escrow_tx_hash        varchar(66),
  resolved_at           timestamptz,
  created_at            timestamptz   NOT NULL DEFAULT now(),
  updated_at            timestamptz   NOT NULL DEFAULT now(),
  CONSTRAINT goals_stake_positive  CHECK (stake_amount > 0),
  CONSTRAINT goals_dates_ordered   CHECK (end_date >= start_date),
  CONSTRAINT goals_attempts_range  CHECK (max_attempts BETWEEN 1 AND 10),
  CONSTRAINT goals_lock_days_range CHECK (extra_lock_days BETWEEN 0 AND 365),
  CONSTRAINT goals_tip_range       CHECK (dev_tip_percent BETWEEN 0 AND 100),
  CONSTRAINT goals_repeat_days_valid CHECK (repeat_days <@ ARRAY[0,1,2,3,4,5,6]::smallint[]
                                            AND cardinality(repeat_days) > 0),
  CONSTRAINT goals_group_mode_consistent CHECK ((is_group AND group_mode IS NOT NULL)
                                             OR (NOT is_group AND group_mode IS NULL))
);
CREATE INDEX goals_owner_status_idx ON goals (owner_id, status);
CREATE TRIGGER goals_set_updated_at BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Configuración específica por tipo de meta (relación 1:1 con goals).
CREATE TABLE goal_alarm_settings (
  goal_id           uuid PRIMARY KEY REFERENCES goals (id) ON DELETE CASCADE,
  target_time       time     NOT NULL,
  reaction_seconds  smallint NOT NULL DEFAULT 60,
  sound_title       varchar(80),
  sound_uri         text,
  vibration_enabled boolean  NOT NULL DEFAULT true,
  CONSTRAINT goal_alarm_reaction_range CHECK (reaction_seconds BETWEEN 10 AND 900)
);

CREATE TABLE goal_app_timer_settings (
  goal_id           uuid PRIMARY KEY REFERENCES goals (id) ON DELETE CASCADE,
  app_package       varchar(160) NOT NULL,
  app_name          varchar(80)  NOT NULL,
  max_daily_minutes smallint     NOT NULL,
  CONSTRAINT goal_app_timer_minutes_range CHECK (max_daily_minutes BETWEEN 1 AND 1440)
);

CREATE TABLE goal_location_settings (
  goal_id     uuid PRIMARY KEY REFERENCES goals (id) ON DELETE CASCADE,
  place_label varchar(120) NOT NULL,
  latitude    double precision NOT NULL,
  longitude   double precision NOT NULL,
  radius_m    integer NOT NULL DEFAULT 150,
  arrive_by   time    NOT NULL,
  CONSTRAINT goal_location_lat_range    CHECK (latitude BETWEEN -90 AND 90),
  CONSTRAINT goal_location_lng_range    CHECK (longitude BETWEEN -180 AND 180),
  CONSTRAINT goal_location_radius_range CHECK (radius_m BETWEEN 25 AND 5000)
);

CREATE TABLE goal_ai_settings (
  goal_id          uuid PRIMARY KEY REFERENCES goals (id) ON DELETE CASCADE,
  prompt           text          NOT NULL,
  verifier         goal_verifier NOT NULL DEFAULT 'ai',
  -- Amigo que juzga las evidencias cuando verifier = 'friend'. Si ese usuario borra su
  -- cuenta queda en NULL y el backend vuelve a usar a la IA como juez; por eso no hay
  -- un CHECK que lo exija (chocaría con el ON DELETE SET NULL).
  verifier_user_id uuid REFERENCES users (id) ON DELETE SET NULL
);

CREATE TABLE goal_participants (
  goal_id      uuid NOT NULL REFERENCES goals (id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  role         participant_role   NOT NULL DEFAULT 'participant',
  status       participant_status NOT NULL DEFAULT 'invited',
  stake_amount numeric(18,6)      NOT NULL DEFAULT 0,
  invited_at   timestamptz        NOT NULL DEFAULT now(),
  responded_at timestamptz,
  PRIMARY KEY (goal_id, user_id),
  CONSTRAINT goal_participants_stake_non_negative CHECK (stake_amount >= 0)
);
CREATE INDEX goal_participants_user_idx ON goal_participants (user_id, status);

-- ----------------------------------------------------------------------------
-- Seguimiento: check-ins, evidencias y uso de apps            (RF-11, RF-12)
-- ----------------------------------------------------------------------------
CREATE TABLE goal_checkins (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id        uuid NOT NULL REFERENCES goals (id) ON DELETE CASCADE,
  user_id        uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  scheduled_for  date           NOT NULL,
  occurred_at    timestamptz    NOT NULL DEFAULT now(),
  result         checkin_result NOT NULL,
  source         checkin_source NOT NULL,
  measured_value numeric(12,2),
  measured_unit  varchar(16),
  latitude       double precision,
  longitude      double precision,
  details        jsonb NOT NULL DEFAULT '{}',
  -- Un resultado por meta, usuario y día: reintentar el mismo día es idempotente.
  CONSTRAINT goal_checkins_one_per_day UNIQUE (goal_id, user_id, scheduled_for)
);
CREATE INDEX goal_checkins_user_time_idx ON goal_checkins (user_id, occurred_at DESC);

CREATE TABLE proofs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id        uuid NOT NULL REFERENCES goals (id) ON DELETE CASCADE,
  user_id        uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  checkin_id     uuid REFERENCES goal_checkins (id) ON DELETE SET NULL,
  media_url      text          NOT NULL,
  note           text,
  status         proof_status  NOT NULL DEFAULT 'pending',
  verifier       goal_verifier NOT NULL DEFAULT 'ai',
  reviewer_id    uuid REFERENCES users (id) ON DELETE SET NULL,
  verdict_reason text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  reviewed_at    timestamptz
);
CREATE INDEX proofs_goal_idx     ON proofs (goal_id, created_at DESC);
CREATE INDEX proofs_reviewer_idx ON proofs (reviewer_id, status);

CREATE TABLE app_usage_samples (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  app_package        varchar(160) NOT NULL,
  app_name           varchar(80)  NOT NULL,
  usage_date         date         NOT NULL,
  foreground_minutes integer      NOT NULL,
  updated_at         timestamptz  NOT NULL DEFAULT now(),
  CONSTRAINT app_usage_minutes_range CHECK (foreground_minutes BETWEEN 0 AND 1440),
  CONSTRAINT app_usage_one_per_day   UNIQUE (user_id, app_package, usage_date)
);

-- ----------------------------------------------------------------------------
-- Billetera: libro mayor de movimientos                (RF-07, RF-14, RF-15)
-- ----------------------------------------------------------------------------
-- `amount` siempre es positivo; el signo lo da `type` (ver v_user_balances).
CREATE TABLE wallet_transactions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  goal_id        uuid REFERENCES goals (id) ON DELETE SET NULL,
  type           tx_type       NOT NULL,
  method         tx_method     NOT NULL DEFAULT 'internal',
  amount         numeric(18,6) NOT NULL,
  currency       varchar(10)   NOT NULL DEFAULT 'USDC',
  status         tx_status     NOT NULL DEFAULT 'confirmed',
  chain          varchar(32),
  tx_hash        varchar(66),
  reference_code varchar(16)   NOT NULL UNIQUE
                 DEFAULT ('WF-' || upper(substr(md5(gen_random_uuid()::text), 1, 10))),
  note           varchar(160),
  created_at     timestamptz NOT NULL DEFAULT now(),
  confirmed_at   timestamptz,
  CONSTRAINT wallet_transactions_amount_positive CHECK (amount > 0)
);
CREATE INDEX wallet_transactions_user_time_idx ON wallet_transactions (user_id, created_at DESC);
CREATE INDEX wallet_transactions_goal_idx      ON wallet_transactions (goal_id);

-- ----------------------------------------------------------------------------
-- Notificaciones y mascota                                    (RF-13, RF-15b)
-- ----------------------------------------------------------------------------
CREATE TABLE notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  type       notification_type NOT NULL DEFAULT 'system',
  title      varchar(120) NOT NULL,
  body       text         NOT NULL DEFAULT '',
  data       jsonb        NOT NULL DEFAULT '{}',
  read_at    timestamptz,
  created_at timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_time_idx ON notifications (user_id, created_at DESC);
CREATE INDEX notifications_unread_idx    ON notifications (user_id) WHERE read_at IS NULL;

CREATE TABLE pets (
  user_id     uuid PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  name        varchar(24) NOT NULL DEFAULT 'Will',
  mood        pet_mood    NOT NULL DEFAULT 'idle',
  energy      smallint    NOT NULL DEFAULT 68,
  streak      integer     NOT NULL DEFAULT 0,
  best_streak integer     NOT NULL DEFAULT 0,
  last_fed_at timestamptz,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pets_energy_range CHECK (energy BETWEEN 0 AND 100),
  CONSTRAINT pets_streak_non_negative CHECK (streak >= 0 AND best_streak >= 0)
);
CREATE TRIGGER pets_set_updated_at BEFORE UPDATE ON pets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

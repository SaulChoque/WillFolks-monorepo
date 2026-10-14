-- =============================================================================
-- WillFolks · fase 1 on-chain
-- Enlaza cada meta con su escrow (WillFolksEscrow en Monad testnet) y deja la
-- wallet del usuario como identidad de cadena. Es idempotente: se puede aplicar
-- sobre una base que ya tiene datos.
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE escrow_state AS ENUM (
    'none',          -- sin escrow: meta simulada o borrador
    'pending',       -- el backend preparó los parámetros; falta la transacción del usuario
    'active',        -- stake bloqueado en el contrato
    'succeeded',     -- el atestador firmó éxito y el stake volvió al usuario
    'failed_locked', -- el atestador firmó fallo; el stake sigue bloqueado hasta unlock_at
    'claimed',       -- tras el bloqueo, el stake volvió al usuario
    'expired',       -- nadie resolvió a tiempo y el stake se recuperó con reclaim
    'cancelled'      -- el usuario canceló antes del inicio
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE goals
  ADD COLUMN IF NOT EXISTS escrow_state         escrow_state NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS escrow_contract      varchar(42),
  ADD COLUMN IF NOT EXISTS escrow_chain_id      integer,
  ADD COLUMN IF NOT EXISTS escrow_goal_id       bigint,
  ADD COLUMN IF NOT EXISTS escrow_start_at      timestamptz,
  ADD COLUMN IF NOT EXISTS escrow_end_at        timestamptz,
  ADD COLUMN IF NOT EXISTS escrow_unlock_at     timestamptz,
  ADD COLUMN IF NOT EXISTS escrow_metadata_hash varchar(66),
  ADD COLUMN IF NOT EXISTS escrow_resolve_tx_hash varchar(66),
  ADD COLUMN IF NOT EXISTS escrow_claim_tx_hash varchar(66),
  ADD COLUMN IF NOT EXISTS escrow_evidence      jsonb,
  ADD COLUMN IF NOT EXISTS escrow_error         text,
  ADD COLUMN IF NOT EXISTS escrow_attempts      smallint NOT NULL DEFAULT 0;

-- Un id de meta del contrato pertenece a una sola meta de la base.
CREATE UNIQUE INDEX IF NOT EXISTS goals_escrow_goal_unique
  ON goals (escrow_chain_id, escrow_contract, escrow_goal_id) WHERE escrow_goal_id IS NOT NULL;
-- El barrendero del backend solo mira las metas con algo pendiente en la cadena.
CREATE INDEX IF NOT EXISTS goals_escrow_open
  ON goals (escrow_state) WHERE escrow_state IN ('active', 'failed_locked');
-- Una wallet identifica a un solo usuario.
CREATE UNIQUE INDEX IF NOT EXISTS users_wallet_unique
  ON users (lower(wallet_address)) WHERE wallet_address IS NOT NULL;

ALTER TABLE users ALTER COLUMN chain SET DEFAULT 'monad-testnet';

COMMENT ON COLUMN goals.escrow_state IS 'Estado del stake en el contrato: none, pending, active, succeeded, failed_locked, claimed, expired o cancelled.';
COMMENT ON COLUMN goals.escrow_contract IS 'Dirección del contrato WillFolksEscrow que custodia el stake de esta meta.';
COMMENT ON COLUMN goals.escrow_chain_id IS 'Chain id de la red del contrato (10143 = Monad testnet).';
COMMENT ON COLUMN goals.escrow_goal_id IS 'Id de la meta dentro del contrato (evento GoalCreated); único por contrato.';
COMMENT ON COLUMN goals.escrow_start_at IS 'Inicio de la meta según el contrato; antes de esto el usuario puede cancelar.';
COMMENT ON COLUMN goals.escrow_end_at IS 'Fin de la meta según el contrato; el éxito solo puede atestarse desde aquí.';
COMMENT ON COLUMN goals.escrow_unlock_at IS 'Cuando el stake de una meta fallida vuelve al usuario (fin de la meta o veredicto, más extra_lock_days).';
COMMENT ON COLUMN goals.escrow_metadata_hash IS 'Hash de la configuración de la meta que el usuario ancló al crearla en el contrato.';
COMMENT ON COLUMN goals.escrow_resolve_tx_hash IS 'Transacción que aplicó el veredicto firmado por el atestador (resolve).';
COMMENT ON COLUMN goals.escrow_claim_tx_hash IS 'Transacción que devolvió el stake tras el bloqueo (claim) o por falta de veredicto (reclaim).';
COMMENT ON COLUMN goals.escrow_evidence IS 'Registro de evidencia firmado: resultados de los controles y veredicto. Su hash es el evidenceHash del contrato.';
COMMENT ON COLUMN goals.escrow_error IS 'Último error al enviar una transacción de cadena; el barrendero reintenta.';
COMMENT ON COLUMN goals.escrow_attempts IS 'Intentos de envío de la transacción de cadena pendiente.';

-- =============================================================================
-- WillFolks · vistas de lectura
-- =============================================================================

-- Saldos por usuario derivados del libro mayor.
--   available : lo que el usuario puede retirar o apostar.
--   in_escrow : apostado en metas que siguen vivas.
--   penalized : perdido en metas falladas (queda bloqueado `extra_lock_days`).
-- Los retiros pendientes ya descuentan del disponible; los depósitos solo
-- cuentan cuando están confirmados.
CREATE VIEW v_user_balances AS
SELECT
  u.id AS user_id,
  COALESCE(SUM(CASE
    WHEN t.status = 'confirmed' AND t.type IN ('deposit', 'stake_release', 'reward') THEN t.amount
    WHEN t.status <> 'failed'   AND t.type IN ('withdrawal', 'stake_lock')           THEN -t.amount
    ELSE 0 END), 0)::numeric(18,6) AS available,
  COALESCE(SUM(CASE
    WHEN t.status <> 'confirmed' THEN 0
    WHEN t.type = 'stake_lock'                               THEN t.amount
    WHEN t.type IN ('stake_release', 'penalty', 'donation')  THEN -t.amount
    ELSE 0 END), 0)::numeric(18,6) AS in_escrow,
  COALESCE(SUM(CASE
    WHEN t.status = 'confirmed' AND t.type IN ('penalty', 'donation') THEN t.amount
    ELSE 0 END), 0)::numeric(18,6) AS penalized
FROM users u
LEFT JOIN wallet_transactions t ON t.user_id = u.id
GROUP BY u.id;

-- Progreso de cada participante en cada meta.
CREATE VIEW v_goal_progress AS
SELECT
  c.goal_id,
  c.user_id,
  COUNT(*) FILTER (WHERE c.result = 'success') AS success_count,
  COUNT(*) FILTER (WHERE c.result = 'fail')    AS fail_count,
  COUNT(*) FILTER (WHERE c.result = 'pending') AS pending_count,
  MAX(c.occurred_at)                           AS last_checkin_at
FROM goal_checkins c
GROUP BY c.goal_id, c.user_id;

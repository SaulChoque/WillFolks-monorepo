-- =============================================================================
-- WillFolks · datos semilla para desarrollo y pruebas e2e
-- -----------------------------------------------------------------------------
-- Cuatro usuarios de demostración. Con el login de desarrollo del backend basta
-- el correo para entrar como cualquiera de ellos (p. ej. saul@willfolks.dev).
-- Los UUID son fijos para poder referenciarlos desde las pruebas.
-- =============================================================================

INSERT INTO users (id, email, username, display_name, auth_provider, provider_subject, wallet_address,
                   location_label, timezone, locale, onboarding_completed_at) VALUES
  ('11111111-1111-4111-8111-111111111111', 'saul@willfolks.dev', 'saul', 'Saul', 'dev', 'saul@willfolks.dev',
   '0x1111111111111111111111111111111111111111', 'La Paz, BO', 'America/La_Paz', 'es', now() - interval '30 days'),
  ('22222222-2222-4222-8222-222222222222', 'ana@willfolks.dev',  'ana',  'Ana',  'dev', 'ana@willfolks.dev',
   '0x2222222222222222222222222222222222222222', 'Santa Cruz, BO', 'America/La_Paz', 'es', now() - interval '20 days'),
  ('33333333-3333-4333-8333-333333333333', 'leo@willfolks.dev',  'leo',  'Leo',  'dev', 'leo@willfolks.dev',
   '0x3333333333333333333333333333333333333333', 'Madrid, ES', 'Europe/Madrid', 'es', now() - interval '10 days'),
  ('44444444-4444-4444-8444-444444444444', 'mia@willfolks.dev',  'mia',  'Mia',  'dev', 'mia@willfolks.dev',
   '0x4444444444444444444444444444444444444444', 'Tokyo, JP', 'Asia/Tokyo', 'en', now() - interval '5 days');

INSERT INTO user_settings (user_id)
SELECT id FROM users;

INSERT INTO pets (user_id, name, mood, energy, streak, best_streak) VALUES
  ('11111111-1111-4111-8111-111111111111', 'Will', 'idle', 68, 7, 12),
  ('22222222-2222-4222-8222-222222222222', 'Will', 'happy', 90, 21, 21),
  ('33333333-3333-4333-8333-333333333333', 'Will', 'sad', 20, 0, 4),
  ('44444444-4444-4444-8444-444444444444', 'Will', 'idle', 55, 2, 2);

-- Saul y Ana ya son amigos; Leo le envió una solicitud a Saul; Mia no conoce a nadie.
INSERT INTO friendships (requester_id, addressee_id, status, responded_at) VALUES
  ('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'accepted', now() - interval '15 days'),
  ('33333333-3333-4333-8333-333333333333', '11111111-1111-4111-8111-111111111111', 'pending', NULL);

-- ----------------------------------------------------------------------------
-- Metas de Saul: una de cada tipo
-- ----------------------------------------------------------------------------
INSERT INTO goals (id, owner_id, kind, title, stake_amount, start_date, end_date, repeat_days,
                   max_attempts, extra_lock_days, dev_tip_percent, is_group, group_mode, escrow_tx_hash) VALUES
  ('a0000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'alarm',
   'Despertar 06:30', 5, CURRENT_DATE - 7, CURRENT_DATE + 23, '{1,2,3,4,5}', 2, 7, 5, true, 'vs',
   '0xa1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1'),
  ('a0000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'app_timer',
   'Menos Instagram', 10, CURRENT_DATE - 3, CURRENT_DATE + 27, '{0,1,2,3,4,5,6}', 1, 7, 0, false, NULL,
   '0xa2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2'),
  ('a0000000-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', 'locator',
   'Gimnasio a tiempo', 5, CURRENT_DATE - 2, CURRENT_DATE + 28, '{1,3,5}', 1, 7, 0, false, NULL,
   '0xa3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3'),
  ('a0000000-0000-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111', 'ai',
   'Ordenar mi cuarto', 8, CURRENT_DATE - 1, CURRENT_DATE + 6, '{6}', 1, 7, 0, false, NULL,
   '0xa4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4');

INSERT INTO goal_alarm_settings (goal_id, target_time, reaction_seconds, sound_title, vibration_enabled) VALUES
  ('a0000000-0000-4000-8000-000000000001', '06:30', 60, 'Default alarm', true);

INSERT INTO goal_app_timer_settings (goal_id, app_package, app_name, max_daily_minutes) VALUES
  ('a0000000-0000-4000-8000-000000000002', 'com.instagram.android', 'Instagram', 30);

INSERT INTO goal_location_settings (goal_id, place_label, latitude, longitude, radius_m, arrive_by) VALUES
  ('a0000000-0000-4000-8000-000000000003', 'Gimnasio Sopocachi', -16.510200, -68.126900, 150, '07:30');

INSERT INTO goal_ai_settings (goal_id, prompt, verifier) VALUES
  ('a0000000-0000-4000-8000-000000000004',
   'La cama está tendida, no hay ropa en el suelo y el escritorio está despejado.', 'ai');

INSERT INTO goal_participants (goal_id, user_id, role, status, stake_amount, responded_at) VALUES
  ('a0000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'owner', 'accepted', 5, now() - interval '7 days'),
  ('a0000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'participant', 'accepted', 5, now() - interval '7 days'),
  ('a0000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'owner', 'accepted', 10, now() - interval '3 days'),
  ('a0000000-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', 'owner', 'accepted', 5, now() - interval '2 days'),
  ('a0000000-0000-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111', 'owner', 'accepted', 8, now() - interval '1 day');

-- ----------------------------------------------------------------------------
-- Libro mayor: depósitos y apuestas bloqueadas
-- ----------------------------------------------------------------------------
INSERT INTO wallet_transactions (user_id, goal_id, type, method, amount, status, chain, tx_hash, note, created_at, confirmed_at) VALUES
  ('11111111-1111-4111-8111-111111111111', NULL, 'deposit', 'crypto', 100, 'confirmed', 'avalanche-fuji',
   '0xd1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1', 'Depósito inicial', now() - interval '30 days', now() - interval '30 days'),
  ('11111111-1111-4111-8111-111111111111', 'a0000000-0000-4000-8000-000000000001', 'stake_lock', 'internal', 5, 'confirmed', 'avalanche-fuji',
   '0xa1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1', 'Despertar 06:30', now() - interval '7 days', now() - interval '7 days'),
  ('11111111-1111-4111-8111-111111111111', 'a0000000-0000-4000-8000-000000000002', 'stake_lock', 'internal', 10, 'confirmed', 'avalanche-fuji',
   '0xa2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2', 'Menos Instagram', now() - interval '3 days', now() - interval '3 days'),
  ('11111111-1111-4111-8111-111111111111', 'a0000000-0000-4000-8000-000000000003', 'stake_lock', 'internal', 5, 'confirmed', 'avalanche-fuji',
   '0xa3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3', 'Gimnasio a tiempo', now() - interval '2 days', now() - interval '2 days'),
  ('11111111-1111-4111-8111-111111111111', 'a0000000-0000-4000-8000-000000000004', 'stake_lock', 'internal', 8, 'confirmed', 'avalanche-fuji',
   '0xa4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4', 'Ordenar mi cuarto', now() - interval '1 day', now() - interval '1 day'),
  ('22222222-2222-4222-8222-222222222222', NULL, 'deposit', 'fiat', 50, 'confirmed', NULL, NULL, 'Depósito QR', now() - interval '20 days', now() - interval '20 days'),
  ('22222222-2222-4222-8222-222222222222', 'a0000000-0000-4000-8000-000000000001', 'stake_lock', 'internal', 5, 'confirmed', 'avalanche-fuji',
   NULL, 'Despertar 06:30', now() - interval '7 days', now() - interval '7 days'),
  ('33333333-3333-4333-8333-333333333333', NULL, 'deposit', 'crypto', 30, 'confirmed', 'avalanche-fuji',
   '0xd3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3', 'Depósito inicial', now() - interval '10 days', now() - interval '10 days');

-- ----------------------------------------------------------------------------
-- Historial: check-ins, uso de apps y notificaciones
-- ----------------------------------------------------------------------------
INSERT INTO goal_checkins (goal_id, user_id, scheduled_for, occurred_at, result, source, measured_value, measured_unit) VALUES
  ('a0000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', CURRENT_DATE - 3, now() - interval '3 days', 'success', 'alarm', 12, 'seconds'),
  ('a0000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', CURRENT_DATE - 2, now() - interval '2 days', 'fail',    'alarm', NULL, NULL),
  ('a0000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', CURRENT_DATE - 1, now() - interval '1 day',  'success', 'alarm', 8, 'seconds'),
  ('a0000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', CURRENT_DATE - 1, now() - interval '1 day',  'success', 'usage', 22, 'minutes');

INSERT INTO app_usage_samples (user_id, app_package, app_name, usage_date, foreground_minutes) VALUES
  ('11111111-1111-4111-8111-111111111111', 'com.instagram.android', 'Instagram', CURRENT_DATE - 2, 41),
  ('11111111-1111-4111-8111-111111111111', 'com.instagram.android', 'Instagram', CURRENT_DATE - 1, 22),
  ('11111111-1111-4111-8111-111111111111', 'com.google.android.youtube', 'YouTube', CURRENT_DATE - 1, 67);

INSERT INTO notifications (user_id, type, title, body, data, read_at, created_at) VALUES
  ('11111111-1111-4111-8111-111111111111', 'friend_request', 'Leo quiere ser tu amigo', 'Acepta la solicitud para retarlo.',
   '{"userId": "33333333-3333-4333-8333-333333333333"}', NULL, now() - interval '2 hours'),
  ('11111111-1111-4111-8111-111111111111', 'goal_result', 'Alarma superada', 'Despertar 06:30 · tu apuesta sigue a salvo.',
   '{"goalId": "a0000000-0000-4000-8000-000000000001"}', now() - interval '20 hours', now() - interval '1 day'),
  ('22222222-2222-4222-8222-222222222222', 'goal_invite', 'Saul te retó', 'Despertar 06:30 · 5 USDC en juego.',
   '{"goalId": "a0000000-0000-4000-8000-000000000001"}', now() - interval '7 days', now() - interval '7 days');

-- Брони, платежи и документы пишет только сервер (service role). Задача SEC-BOOKING-PRICE.
-- Клиент с anon-ключом и своей сессией больше не может INSERT/UPDATE в bookings, payments,
-- documents и загружать файлы в Storage-бакет documents. Чтение своих строк и админские
-- политики admin_all_* не меняются.
--
-- ПОРЯДОК: применять ПОСЛЕ деплоя кода, где /api/bookings/create, payments/create, extend,
-- sign и cancel пишут через service role. Раньше — сломается бронирование из браузера.
-- Скрипт идемпотентен: DROP POLICY IF EXISTS.

DROP POLICY IF EXISTS "bookings_insert_own" ON bookings;
DROP POLICY IF EXISTS "bookings_update_own" ON bookings;

DROP POLICY IF EXISTS "payments_insert_own" ON payments;
DROP POLICY IF EXISTS "payments_update_own" ON payments;

DROP POLICY IF EXISTS "documents_insert_own" ON documents;
DROP POLICY IF EXISTS "documents_update_own" ON documents;

-- Storage: договоры кладёт только webhook (service role)
DROP POLICY IF EXISTS "documents_insert_own" ON storage.objects;

-- Проверка (должно вернуть 0 строк):
-- SELECT schemaname, tablename, policyname, cmd FROM pg_policies
-- WHERE policyname IN ('bookings_insert_own','bookings_update_own','payments_insert_own',
--   'payments_update_own','documents_insert_own','documents_update_own');

-- Откат (только если код откатили к версии с записью из браузера):
-- CREATE POLICY "bookings_insert_own" ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
-- CREATE POLICY "bookings_update_own" ON bookings FOR UPDATE USING (auth.uid() = user_id);
-- CREATE POLICY "payments_insert_own" ON payments FOR INSERT WITH CHECK (auth.uid() = user_id);
-- CREATE POLICY "payments_update_own" ON payments FOR UPDATE USING (auth.uid() = user_id);
-- CREATE POLICY "documents_insert_own" ON documents FOR INSERT WITH CHECK (auth.uid() = user_id);
-- CREATE POLICY "documents_update_own" ON documents FOR UPDATE USING (auth.uid() = user_id);
-- CREATE POLICY "documents_insert_own" ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

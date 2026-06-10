-- Договоры: метаданные подписания в bookings, sha256 в documents, Storage read policy.
-- Выполнить в Supabase SQL Editor после 001–005 (003 желателен для бакета documents).
-- Скрипт идемпотентен: IF NOT EXISTS, ON CONFLICT DO NOTHING, DROP POLICY IF EXISTS.

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS contract_version text,
  ADD COLUMN IF NOT EXISTS signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS sign_ip text,
  ADD COLUMN IF NOT EXISTS sign_user_agent text,
  ADD COLUMN IF NOT EXISTS consent_pdn boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_crossborder boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_marketing boolean NOT NULL DEFAULT false;

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS sha256 text;

-- Приватный бакет для документов
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Клиент видит только свои файлы (путь начинается с его user_id)
DROP POLICY IF EXISTS "documents_read_own" ON storage.objects;
CREATE POLICY "documents_read_own" ON storage.objects FOR SELECT
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

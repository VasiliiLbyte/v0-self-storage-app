-- Admin: ячейки «на обслуживании» (не показываются в публичном бронировании)
ALTER TABLE public.boxes
  ADD COLUMN IF NOT EXISTS in_maintenance BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.boxes.in_maintenance IS 'Если true — ячейка на обслуживании, бронирование с сайта недоступно.';

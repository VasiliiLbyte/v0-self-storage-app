-- Seed data for ПЕЛИКАН (53 ячейки + отзывы)

DELETE FROM documents;
DELETE FROM payments;
DELETE FROM bookings;
DELETE FROM boxes;

-- 53 ячейки по экспликации плана (тип и м² на номер); цена — формула от типа и площади
INSERT INTO boxes (
  name, type, number, floor, zone,
  size_m2, width_m, depth_m, height_m,
  price_month, description, features, is_available
)
SELECT
  format('Ячейка %s · %s', n, typ),
  typ,
  n::integer,
  1::smallint,
  'Экспликация'::text,
  round(sz_m2::numeric, 2)::decimal(5, 2),
  round((sz_m2::numeric / 1.20)::numeric, 2)::decimal(4, 2),
  1.20::decimal(4, 2),
  2.40::decimal(4, 2),
  ROUND(
    CASE typ
      WHEN 'XS' THEN 1490 + (sz_m2 - 1.0) * 600
      WHEN 'S' THEN 2390 + (sz_m2 - 1.8) * 1000
      WHEN 'M' THEN 3790 + (sz_m2 - 3.0) * 800
      WHEN 'L' THEN 5490 + (sz_m2 - 4.0) * 900
    END
  )::integer,
  format('По экспликации плана: %s м².', round(sz_m2::numeric, 2)),
  ARRAY['Климат-контроль', 'Доступ 24/7']::text[],
  true
FROM (
  VALUES
    (1, 'XS', 1.0::numeric),
    (2, 'XS', 1.0::numeric),
    (3, 'S', 1.9::numeric),
    (4, 'XS', 1.3::numeric),
    (5, 'XS', 1.0::numeric),
    (6, 'S', 1.8::numeric),
    (7, 'S', 2.2::numeric),
    (8, 'XS', 1.2::numeric),
    (9, 'S', 2.1::numeric),
    (10, 'M', 3.4::numeric),
    (11, 'M', 3.0::numeric),
    (12, 'L', 5.0::numeric),
    (13, 'S', 2.2::numeric),
    (14, 'M', 3.5::numeric),
    (15, 'M', 3.5::numeric),
    (16, 'L', 5.0::numeric),
    (17, 'S', 2.0::numeric),
    (18, 'S', 2.0::numeric),
    (19, 'M', 3.3::numeric),
    (20, 'M', 3.3::numeric),
    (21, 'M', 3.3::numeric),
    (22, 'L', 4.5::numeric),
    (23, 'L', 4.0::numeric),
    (24, 'XS', 1.2::numeric),
    (25, 'XS', 1.1::numeric),
    (26, 'XS', 1.1::numeric),
    (27, 'XS', 1.1::numeric),
    (28, 'XS', 1.1::numeric),
    (29, 'XS', 1.1::numeric),
    (30, 'XS', 1.1::numeric),
    (31, 'XS', 1.1::numeric),
    (32, 'XS', 1.1::numeric),
    (33, 'S', 2.1::numeric),
    (34, 'S', 2.1::numeric),
    (35, 'M', 3.4::numeric),
    (36, 'S', 2.2::numeric),
    (37, 'S', 2.2::numeric),
    (38, 'S', 2.2::numeric),
    (39, 'S', 2.2::numeric),
    (40, 'S', 2.2::numeric),
    (41, 'XS', 1.2::numeric),
    (42, 'S', 2.2::numeric),
    (43, 'L', 4.5::numeric),
    (44, 'M', 3.0::numeric),
    (45, 'M', 3.0::numeric),
    (46, 'M', 3.1::numeric),
    (47, 'M', 3.5::numeric),
    (48, 'S', 2.2::numeric),
    (49, 'XS', 1.2::numeric),
    (50, 'L', 4.5::numeric),
    (51, 'S', 2.0::numeric),
    (52, 'S', 2.0::numeric),
    (53, 'S', 2.2::numeric)
) AS t (n, typ, sz_m2);

-- Отзывы
INSERT INTO reviews (author_name, author_role, content, rating) VALUES
('Алексей Петров', 'Предприниматель', 'Переезжал офис и нужно было где-то хранить мебель месяц. Всё прошло идеально — забронировал за 5 минут, приехал, всё чисто и сухо. Код доступа работает круглосуточно.', 5),
('Мария Соколова', 'Дизайнер интерьеров', 'Храню образцы материалов и мебель для проектов. Очень удобно, что есть климат-контроль — ткани и дерево в отличном состоянии даже через полгода.', 5),
('Дмитрий Волков', 'Путешественник', 'Уезжал на год в Азию, сдал квартиру, а вещи оставил в боксе. Вернулся — всё как новое. Автопродление спасло от головной боли с платежами.', 5),
('Анна Кузнецова', 'Молодая мама', 'Детские вещи занимали всю квартиру. Теперь коляска, кроватка и игрушки старшего ждут младшего в тёплом сухом месте. Освободили целую комнату!', 5),
('Игорь Смирнов', 'Коллекционер', 'Храню коллекцию винила и комиксов. Температура стабильная, влажность в норме. Спокоен за свои сокровища.', 5);

-- Seed data for ПЕЛИКАН (53 ячейки + отзывы)

DELETE FROM documents;
DELETE FROM payments;
DELETE FROM bookings;
DELETE FROM boxes;

-- 53 ячейки: XS×16, S×19, M×12, L×6; номера 1–53; floor/zone — условная сетка по плану
INSERT INTO boxes (
  name, type, number, floor, zone,
  size_m2, width_m, depth_m, height_m,
  price_month, description, features, is_available
)
SELECT
  format('Ячейка %s · %s', n, typ),
  typ,
  n::integer,
  fl,
  zn,
  round(sz::numeric, 2)::decimal(5, 2),
  round((sz::numeric / 1.20)::numeric, 2)::decimal(4, 2),
  1.20::decimal(4, 2),
  2.40::decimal(4, 2),
  round(pr::numeric, 0)::integer,
  format('Зона %s, этаж %s.', zn, fl),
  ARRAY['Климат-контроль', 'Доступ 24/7']::text[],
  true
FROM (
  SELECT
    gs AS n,
    CASE
      WHEN gs <= 16 THEN 'XS'
      WHEN gs <= 35 THEN 'S'
      WHEN gs <= 47 THEN 'M'
      ELSE 'L'
    END AS typ,
    CASE
      WHEN gs <= 8 THEN 'XS_A'
      WHEN gs <= 16 THEN 'XS_B'
      WHEN gs <= 26 THEN 'S_A'
      WHEN gs <= 35 THEN 'S_B'
      WHEN gs <= 41 THEN 'M_A'
      WHEN gs <= 47 THEN 'M_B'
      ELSE 'L_A'
    END AS zn,
    CASE
      WHEN gs <= 26 THEN 1::smallint
      WHEN gs <= 41 THEN 2::smallint
      ELSE 3::smallint
    END AS fl,
    CASE
      WHEN gs <= 16 THEN (1.0::numeric + 0.3 * (gs - 1) / 15.0)
      WHEN gs <= 35 THEN (1.8::numeric + 0.4 * (gs - 17) / 18.0)
      WHEN gs <= 47 THEN (3.0::numeric + 0.5 * (gs - 36) / 11.0)
      ELSE (4.0::numeric + 1.0 * (gs - 48) / 5.0)
    END AS sz,
    CASE
      WHEN gs <= 16 THEN (1490::numeric + 400 * (gs - 1) / 15.0)
      WHEN gs <= 35 THEN (2490::numeric + 500 * (gs - 17) / 18.0)
      WHEN gs <= 47 THEN (3990::numeric + 1000 * (gs - 36) / 11.0)
      ELSE (5990::numeric + 2000 * (gs - 48) / 5.0)
    END AS pr
  FROM generate_series(1, 53) AS gs
) t;

-- Отзывы
INSERT INTO reviews (author_name, author_role, content, rating) VALUES
('Алексей Петров', 'Предприниматель', 'Переезжал офис и нужно было где-то хранить мебель месяц. Всё прошло идеально — забронировал за 5 минут, приехал, всё чисто и сухо. Код доступа работает круглосуточно.', 5),
('Мария Соколова', 'Дизайнер интерьеров', 'Храню образцы материалов и мебель для проектов. Очень удобно, что есть климат-контроль — ткани и дерево в отличном состоянии даже через полгода.', 5),
('Дмитрий Волков', 'Путешественник', 'Уезжал на год в Азию, сдал квартиру, а вещи оставил в боксе. Вернулся — всё как новое. Автопродление спасло от головной боли с платежами.', 5),
('Анна Кузнецова', 'Молодая мама', 'Детские вещи занимали всю квартиру. Теперь коляска, кроватка и игрушки старшего ждут младшего в тёплом сухом месте. Освободили целую комнату!', 5),
('Игорь Смирнов', 'Коллекционер', 'Храню коллекцию винила и комиксов. Температура стабильная, влажность в норме. Спокоен за свои сокровища.', 5);

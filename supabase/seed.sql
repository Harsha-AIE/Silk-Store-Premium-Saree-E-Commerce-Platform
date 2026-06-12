-- Seed categories (run after 001_schema.sql)
INSERT INTO categories (name, slug, sort_order) VALUES
  ('Bridal Silk', 'bridal-silk', 0),
  ('Wedding Collection', 'wedding-collection', 1),
  ('Designer Silk', 'designer-silk', 2),
  ('Festive Collection', 'festive-collection', 3),
  ('Traditional Collection', 'traditional-collection', 4),
  ('Party Wear', 'party-wear', 5),
  ('Soft Silk', 'soft-silk', 6),
  ('Exclusive Collection', 'exclusive-collection', 7)
ON CONFLICT (name) DO NOTHING;

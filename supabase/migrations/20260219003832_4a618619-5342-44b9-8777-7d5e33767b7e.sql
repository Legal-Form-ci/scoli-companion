
-- Migrate products from old categories to Scoly categories
-- Manuels Préscolaire -> Scoly Primaire
UPDATE products SET category_id = '81b59ff7-67ca-419f-a7de-f7ad31bb1cf0' WHERE category_id = 'f0a195f0-ca25-41ad-8cff-ee906308c8bb';

-- Manuels Primaire -> Scoly Primaire
UPDATE products SET category_id = '81b59ff7-67ca-419f-a7de-f7ad31bb1cf0' WHERE category_id = '8078ff8b-253f-47f7-90a0-2bbe4008b28f';

-- Manuels Secondaire 1er Cycle -> Scoly Secondaire
UPDATE products SET category_id = '059fad77-ff9c-4df2-a020-7cdbb417b792' WHERE category_id = '6d1098ae-89e2-42a1-866d-1940eed349a2';

-- Manuels Secondaire 2nd Cycle -> Scoly Secondaire
UPDATE products SET category_id = '059fad77-ff9c-4df2-a020-7cdbb417b792' WHERE category_id = '07265278-3323-489c-85df-88a89e2c9619';

-- Œuvres Intégrales -> Scoly Librairie
UPDATE products SET category_id = 'b9eee6fa-07c0-4e22-9e66-1ecac6998806' WHERE category_id = '31fbe4dd-4123-41e1-896c-f6bc51416a56';

-- Delete old categories
DELETE FROM categories WHERE id IN (
  'f0a195f0-ca25-41ad-8cff-ee906308c8bb',
  '8078ff8b-253f-47f7-90a0-2bbe4008b28f',
  '6d1098ae-89e2-42a1-866d-1940eed349a2',
  '07265278-3323-489c-85df-88a89e2c9619',
  '31fbe4dd-4123-41e1-896c-f6bc51416a56'
);

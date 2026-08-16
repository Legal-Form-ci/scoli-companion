
-- ============================================
-- STEP 1: Clean up related data
-- ============================================
DELETE FROM public.cart_items;
DELETE FROM public.wishlist;
DELETE FROM public.reviews;
DELETE FROM public.order_items WHERE product_id IS NOT NULL;

-- STEP 2: Delete all existing products
DELETE FROM public.products;

-- ============================================
-- STEP 3: Insert 22 real preschool textbooks
-- ============================================

-- Category ID for Scoly Primaire (covers Préscolaire in CI)
-- 81b59ff7-67ca-419f-a7de-f7ad31bb1cf0

-- 1. Arc-en-Ciel PS 3 ans (Maths/EDHC/AEC)
INSERT INTO public.products (
  name_fr, name_en, name_de, name_es,
  description_fr, description_en, description_de, description_es,
  price, original_price, discount_percent, stock,
  image_url, category_id, is_active, is_featured, free_shipping,
  subject, education_level, education_series, product_type,
  brand, author_name, author_details, product_genre
) VALUES (
  'Mes apprentissages à la maternelle - Petite Section 3 ans',
  'My Preschool Learning - Small Section 3 years',
  'Mein Vorschullernen - Kleine Abteilung 3 Jahre',
  'Mis aprendizajes en preescolar - Sección Pequeña 3 años',
  'Manuel scolaire de la collection Arc-en-Ciel pour la Petite Section (3 ans). Couvre les matières : Mathématiques, EDHC et AEC. Conforme au programme officiel de Côte d''Ivoire. Éditions JP Cames. Idéal pour accompagner l''enfant dans ses premiers apprentissages à la maternelle.',
  'Textbook from the Arc-en-Ciel collection for Small Section (3 years). Covers: Mathematics, EDHC and AEC. Compliant with the official Ivory Coast curriculum. JP Cames Editions.',
  'Lehrbuch der Arc-en-Ciel-Sammlung für die Kleine Abteilung (3 Jahre). Fächer: Mathematik, EDHC und AEC. JP Cames Verlag.',
  'Manual escolar de la colección Arc-en-Ciel para Sección Pequeña (3 años). Materias: Matemáticas, EDHC y AEC. Ediciones JP Cames.',
  2100, 2100, 0, 50,
  '/products/maternelle/arc-en-ciel-ps-3ans.jpg',
  '81b59ff7-67ca-419f-a7de-f7ad31bb1cf0',
  true, true, true,
  'Pluridisciplines', 'Préscolaire - Petite Section', NULL, 'Manuel scolaire',
  'JP Cames Éditions', NULL, 'Collection Arc-en-Ciel', 'Scolaire'
);

-- 2. Arc-en-Ciel MS 4 ans (Maths/EDHC/AEC)
INSERT INTO public.products (
  name_fr, name_en, name_de, name_es,
  description_fr, description_en, description_de, description_es,
  price, original_price, discount_percent, stock,
  image_url, category_id, is_active, is_featured, free_shipping,
  subject, education_level, education_series, product_type,
  brand, author_name, author_details, product_genre
) VALUES (
  'Mes apprentissages à la maternelle - Moyenne Section 4 ans',
  'My Preschool Learning - Middle Section 4 years',
  'Mein Vorschullernen - Mittlere Abteilung 4 Jahre',
  'Mis aprendizajes en preescolar - Sección Media 4 años',
  'Manuel scolaire de la collection Arc-en-Ciel pour la Moyenne Section (4 ans). Couvre les matières : Mathématiques, EDHC et AEC. Conforme au programme officiel de Côte d''Ivoire. Éditions JP Cames. Un outil complet pour l''éveil et le développement de l''enfant en maternelle.',
  'Textbook from the Arc-en-Ciel collection for Middle Section (4 years). Covers: Mathematics, EDHC and AEC. JP Cames Editions.',
  'Lehrbuch der Arc-en-Ciel-Sammlung für die Mittlere Abteilung (4 Jahre). Fächer: Mathematik, EDHC und AEC. JP Cames Verlag.',
  'Manual escolar de la colección Arc-en-Ciel para Sección Media (4 años). Materias: Matemáticas, EDHC y AEC. Ediciones JP Cames.',
  2100, 2100, 0, 50,
  '/products/maternelle/arc-en-ciel-ms-4ans.jpg',
  '81b59ff7-67ca-419f-a7de-f7ad31bb1cf0',
  true, true, true,
  'Pluridisciplines', 'Préscolaire - Moyenne Section', NULL, 'Manuel scolaire',
  'JP Cames Éditions', NULL, 'Collection Arc-en-Ciel', 'Scolaire'
);

-- 3. Arc-en-Ciel GS 5 ans (AEM/Lecture/Graphisme)
INSERT INTO public.products (
  name_fr, name_en, name_de, name_es,
  description_fr, description_en, description_de, description_es,
  price, original_price, discount_percent, stock,
  image_url, category_id, is_active, is_featured, free_shipping,
  subject, education_level, education_series, product_type,
  brand, author_name, author_details, product_genre
) VALUES (
  'Mes apprentissages à la maternelle - Grande Section 5 ans (AEM/Lecture/Graphisme)',
  'My Preschool Learning - Large Section 5 years (AEM/Reading/Writing)',
  'Mein Vorschullernen - Große Abteilung 5 Jahre (AEM/Lesen/Schreiben)',
  'Mis aprendizajes en preescolar - Sección Grande 5 años (AEM/Lectura/Grafismo)',
  'Manuel scolaire de la collection Arc-en-Ciel pour la Grande Section (5 ans). Livret AEM, Lecture et Graphisme. Conforme au programme officiel de Côte d''Ivoire. Éditions JP Cames. Prépare l''enfant à l''entrée au CP1 avec des activités d''expression, de lecture et de graphisme.',
  'Textbook from the Arc-en-Ciel collection for Large Section (5 years). AEM, Reading and Writing booklet. JP Cames Editions.',
  'Lehrbuch der Arc-en-Ciel-Sammlung für die Große Abteilung (5 Jahre). AEM, Lesen und Schreiben. JP Cames Verlag.',
  'Manual escolar de la colección Arc-en-Ciel para Sección Grande (5 años). Cuaderno AEM, Lectura y Grafismo. Ediciones JP Cames.',
  2100, 2100, 0, 45,
  '/products/maternelle/arc-en-ciel-gs-5ans-aem.jpg',
  '81b59ff7-67ca-419f-a7de-f7ad31bb1cf0',
  true, true, true,
  'Lecture', 'Préscolaire - Grande Section', NULL, 'Manuel scolaire',
  'JP Cames Éditions', NULL, 'Collection Arc-en-Ciel', 'Scolaire'
);

-- 4. Arc-en-Ciel MS 4 ans (variante photo)
INSERT INTO public.products (
  name_fr, name_en, name_de, name_es,
  description_fr, description_en, description_de, description_es,
  price, original_price, discount_percent, stock,
  image_url, category_id, is_active, is_featured, free_shipping,
  subject, education_level, education_series, product_type,
  brand, author_name, author_details, product_genre
) VALUES (
  'Mes apprentissages à la maternelle - Moyenne Section 4 ans (AEM/Lecture/Graphisme)',
  'My Preschool Learning - Middle Section 4 years (AEM/Reading/Writing)',
  'Mein Vorschullernen - Mittlere Abteilung 4 Jahre (AEM/Lesen/Schreiben)',
  'Mis aprendizajes en preescolar - Sección Media 4 años (AEM/Lectura/Grafismo)',
  'Manuel scolaire de la collection Arc-en-Ciel pour la Moyenne Section (4 ans). Livret AEM, Lecture et Graphisme. Conforme au programme officiel de Côte d''Ivoire. Éditions JP Cames. Complète le livret Maths/EDHC/AEC pour un apprentissage complet.',
  'Textbook from the Arc-en-Ciel collection for Middle Section (4 years). AEM, Reading and Writing booklet. JP Cames Editions.',
  'Lehrbuch der Arc-en-Ciel-Sammlung für die Mittlere Abteilung (4 Jahre). AEM, Lesen und Schreiben. JP Cames Verlag.',
  'Manual escolar de la colección Arc-en-Ciel para Sección Media (4 años). Cuaderno AEM, Lectura y Grafismo. Ediciones JP Cames.',
  2100, 2100, 0, 45,
  '/products/maternelle/arc-en-ciel-ms-4ans-v2.jpg',
  '81b59ff7-67ca-419f-a7de-f7ad31bb1cf0',
  true, false, true,
  'Lecture', 'Préscolaire - Moyenne Section', NULL, 'Manuel scolaire',
  'JP Cames Éditions', NULL, 'Collection Arc-en-Ciel', 'Scolaire'
);

-- 5. Arc-en-Ciel GS 5 ans - Set 2 livrets (Maths + AEM)
INSERT INTO public.products (
  name_fr, name_en, name_de, name_es,
  description_fr, description_en, description_de, description_es,
  price, original_price, discount_percent, stock,
  image_url, category_id, is_active, is_featured, free_shipping,
  subject, education_level, education_series, product_type,
  brand, author_name, author_details, product_genre
) VALUES (
  'Mes apprentissages à la maternelle - Grande Section 5 ans (Set 2 livrets)',
  'My Preschool Learning - Large Section 5 years (2-booklet set)',
  'Mein Vorschullernen - Große Abteilung 5 Jahre (2er-Set)',
  'Mis aprendizajes en preescolar - Sección Grande 5 años (Set 2 cuadernos)',
  'Set complet de 2 livrets Arc-en-Ciel pour la Grande Section (5 ans). Livret 1 : AEM, Lecture, Graphisme. Livret 2 : Maths, EDHC, AEC. Conforme au programme officiel de Côte d''Ivoire. Éditions JP Cames. Le pack idéal pour préparer l''entrée au CP1.',
  'Complete set of 2 Arc-en-Ciel booklets for Large Section (5 years). Booklet 1: AEM, Reading, Writing. Booklet 2: Maths, EDHC, AEC. JP Cames Editions.',
  'Komplettset von 2 Arc-en-Ciel-Heften für die Große Abteilung (5 Jahre). JP Cames Verlag.',
  'Set completo de 2 cuadernos Arc-en-Ciel para Sección Grande (5 años). Ediciones JP Cames.',
  5000, 5000, 0, 30,
  '/products/maternelle/arc-en-ciel-gs-5ans-set.jpg',
  '81b59ff7-67ca-419f-a7de-f7ad31bb1cf0',
  true, true, true,
  'Pluridisciplines', 'Préscolaire - Grande Section', NULL, 'Manuel scolaire',
  'JP Cames Éditions', NULL, 'Collection Arc-en-Ciel', 'Scolaire'
);

-- 6. Comment Réussir PS Livret 1 (AEM/Maths/AEC)
INSERT INTO public.products (
  name_fr, name_en, name_de, name_es,
  description_fr, description_en, description_de, description_es,
  price, original_price, discount_percent, stock,
  image_url, category_id, is_active, is_featured, free_shipping,
  subject, education_level, education_series, product_type,
  brand, author_name, author_details, product_genre
) VALUES (
  'Comment Réussir ma Maternelle ? - Petite Section Livret 1',
  'How to Succeed in Preschool? - Small Section Booklet 1',
  'Wie gelingt mein Kindergarten? - Kleine Abteilung Heft 1',
  '¿Cómo tener éxito en preescolar? - Sección Pequeña Cuaderno 1',
  'Cahier d''activités pour la Petite Section. Couvre : AEM, Mathématiques et AEC. Éditions ARE (Africa Reflets Éditions). Conforme au programme officiel ivoirien. Illustrations colorées et exercices adaptés aux enfants de 3 ans.',
  'Activity workbook for Small Section. Covers: AEM, Mathematics and AEC. ARE Editions. Compliant with the official Ivorian curriculum.',
  'Arbeitsheft für die Kleine Abteilung. Fächer: AEM, Mathematik und AEC. ARE Verlag.',
  'Cuaderno de actividades para Sección Pequeña. Materias: AEM, Matemáticas y AEC. Ediciones ARE.',
  1800, 1800, 0, 40,
  '/products/maternelle/comment-reussir-ps-livret1.jpg',
  '81b59ff7-67ca-419f-a7de-f7ad31bb1cf0',
  true, false, true,
  'Pluridisciplines', 'Préscolaire - Petite Section', NULL, 'Manuel scolaire',
  'Africa Reflets Éditions (ARE)', NULL, 'Collection Comment Réussir', 'Scolaire'
);

-- 7. Comment Réussir PS Livret 2 (Graphisme/Lecture/EPS/EDHC/Comptines)
INSERT INTO public.products (
  name_fr, name_en, name_de, name_es,
  description_fr, description_en, description_de, description_es,
  price, original_price, discount_percent, stock,
  image_url, category_id, is_active, is_featured, free_shipping,
  subject, education_level, education_series, product_type,
  brand, author_name, author_details, product_genre
) VALUES (
  'Comment Réussir ma Maternelle ? - Petite Section Livret 2',
  'How to Succeed in Preschool? - Small Section Booklet 2',
  'Wie gelingt mein Kindergarten? - Kleine Abteilung Heft 2',
  '¿Cómo tener éxito en preescolar? - Sección Pequeña Cuaderno 2',
  'Cahier d''activités pour la Petite Section – Livret 2. Couvre : Graphisme, Lecture, EPS, EDHC, Comptines et Poèmes. Éditions ARE (Africa Reflets Éditions). Conforme au programme officiel ivoirien. Complète le Livret 1 pour un apprentissage complet.',
  'Activity workbook for Small Section – Booklet 2. Covers: Writing, Reading, PE, EDHC, Nursery Rhymes and Poems. ARE Editions.',
  'Arbeitsheft für die Kleine Abteilung – Heft 2. Fächer: Schreiben, Lesen, Sport, EDHC, Reime. ARE Verlag.',
  'Cuaderno de actividades para Sección Pequeña – Cuaderno 2. Materias: Grafismo, Lectura, EPS, EDHC, Rimas y Poemas. Ediciones ARE.',
  1800, 1800, 0, 40,
  '/products/maternelle/comment-reussir-ps-livret2.jpg',
  '81b59ff7-67ca-419f-a7de-f7ad31bb1cf0',
  true, false, true,
  'Pluridisciplines', 'Préscolaire - Petite Section', NULL, 'Manuel scolaire',
  'Africa Reflets Éditions (ARE)', NULL, 'Collection Comment Réussir', 'Scolaire'
);

-- 8. Comment Réussir MS Livret 1 (Maths/AEM/Informatique/AEC)
INSERT INTO public.products (
  name_fr, name_en, name_de, name_es,
  description_fr, description_en, description_de, description_es,
  price, original_price, discount_percent, stock,
  image_url, category_id, is_active, is_featured, free_shipping,
  subject, education_level, education_series, product_type,
  brand, author_name, author_details, product_genre
) VALUES (
  'Comment Réussir ma Maternelle ? - Moyenne Section Livret 1',
  'How to Succeed in Preschool? - Middle Section Booklet 1',
  'Wie gelingt mein Kindergarten? - Mittlere Abteilung Heft 1',
  '¿Cómo tener éxito en preescolar? - Sección Media Cuaderno 1',
  'Cahier d''activités pour la Moyenne Section – Livret 1. Couvre : Mathématiques, AEM, Informatique et AEC. Éditions ARE (Africa Reflets Éditions). Conforme au programme officiel ivoirien. Activités ludiques et éducatives pour les enfants de 4 ans.',
  'Activity workbook for Middle Section – Booklet 1. Covers: Mathematics, AEM, IT and AEC. ARE Editions.',
  'Arbeitsheft für die Mittlere Abteilung – Heft 1. Fächer: Mathematik, AEM, Informatik und AEC. ARE Verlag.',
  'Cuaderno de actividades para Sección Media – Cuaderno 1. Materias: Matemáticas, AEM, Informática y AEC. Ediciones ARE.',
  1800, 1800, 0, 40,
  '/products/maternelle/comment-reussir-ms-livret1.jpg',
  '81b59ff7-67ca-419f-a7de-f7ad31bb1cf0',
  true, false, true,
  'Pluridisciplines', 'Préscolaire - Moyenne Section', NULL, 'Manuel scolaire',
  'Africa Reflets Éditions (ARE)', NULL, 'Collection Comment Réussir', 'Scolaire'
);

-- 9. Comment Réussir MS Livret 2 (EDHC/EPS/Langage/Graphisme/Comptines/Lecture)
INSERT INTO public.products (
  name_fr, name_en, name_de, name_es,
  description_fr, description_en, description_de, description_es,
  price, original_price, discount_percent, stock,
  image_url, category_id, is_active, is_featured, free_shipping,
  subject, education_level, education_series, product_type,
  brand, author_name, author_details, product_genre
) VALUES (
  'Comment Réussir ma Maternelle ? - Moyenne Section Livret 2',
  'How to Succeed in Preschool? - Middle Section Booklet 2',
  'Wie gelingt mein Kindergarten? - Mittlere Abteilung Heft 2',
  '¿Cómo tener éxito en preescolar? - Sección Media Cuaderno 2',
  'Cahier d''activités pour la Moyenne Section – Livret 2. Couvre : EDHC, EPS, Langage, Graphisme, Comptines et Poèmes, Lecture. Éditions ARE (Africa Reflets Éditions). Conforme au programme officiel ivoirien. Complète le Livret 1 pour une formation complète.',
  'Activity workbook for Middle Section – Booklet 2. Covers: EDHC, PE, Language, Writing, Rhymes, Reading. ARE Editions.',
  'Arbeitsheft für die Mittlere Abteilung – Heft 2. Fächer: EDHC, Sport, Sprache, Schreiben, Reime, Lesen. ARE Verlag.',
  'Cuaderno de actividades para Sección Media – Cuaderno 2. Materias: EDHC, EPS, Lenguaje, Grafismo, Rimas, Lectura. Ediciones ARE.',
  1800, 1800, 0, 40,
  '/products/maternelle/comment-reussir-ms-livret2.jpg',
  '81b59ff7-67ca-419f-a7de-f7ad31bb1cf0',
  true, false, true,
  'Pluridisciplines', 'Préscolaire - Moyenne Section', NULL, 'Manuel scolaire',
  'Africa Reflets Éditions (ARE)', NULL, 'Collection Comment Réussir', 'Scolaire'
);

-- 10. Comment Réussir GS Livret 1 (Maths/AEC/AEM/Informatiques)
INSERT INTO public.products (
  name_fr, name_en, name_de, name_es,
  description_fr, description_en, description_de, description_es,
  price, original_price, discount_percent, stock,
  image_url, category_id, is_active, is_featured, free_shipping,
  subject, education_level, education_series, product_type,
  brand, author_name, author_details, product_genre
) VALUES (
  'Comment Réussir ma Maternelle ? - Grande Section Livret 1',
  'How to Succeed in Preschool? - Large Section Booklet 1',
  'Wie gelingt mein Kindergarten? - Große Abteilung Heft 1',
  '¿Cómo tener éxito en preescolar? - Sección Grande Cuaderno 1',
  'Cahier d''activités pour la Grande Section – Livret 1. Couvre : Mathématiques, AEC, AEM et Informatiques. Éditions ARE (Africa Reflets Éditions). Conforme au programme officiel ivoirien. Prépare l''enfant de 5 ans à l''entrée au CP1.',
  'Activity workbook for Large Section – Booklet 1. Covers: Mathematics, AEC, AEM and IT. ARE Editions.',
  'Arbeitsheft für die Große Abteilung – Heft 1. Fächer: Mathematik, AEC, AEM und Informatik. ARE Verlag.',
  'Cuaderno de actividades para Sección Grande – Cuaderno 1. Materias: Matemáticas, AEC, AEM e Informática. Ediciones ARE.',
  1800, 1800, 0, 40,
  '/products/maternelle/comment-reussir-gs-livret1.jpg',
  '81b59ff7-67ca-419f-a7de-f7ad31bb1cf0',
  true, false, true,
  'Pluridisciplines', 'Préscolaire - Grande Section', NULL, 'Manuel scolaire',
  'Africa Reflets Éditions (ARE)', NULL, 'Collection Comment Réussir', 'Scolaire'
);

-- 11. Comment Réussir GS Livret 2 (EDHC/Graphisme/Langage/EPS/Lecture/Comptines)
INSERT INTO public.products (
  name_fr, name_en, name_de, name_es,
  description_fr, description_en, description_de, description_es,
  price, original_price, discount_percent, stock,
  image_url, category_id, is_active, is_featured, free_shipping,
  subject, education_level, education_series, product_type,
  brand, author_name, author_details, product_genre
) VALUES (
  'Comment Réussir ma Maternelle ? - Grande Section Livret 2',
  'How to Succeed in Preschool? - Large Section Booklet 2',
  'Wie gelingt mein Kindergarten? - Große Abteilung Heft 2',
  '¿Cómo tener éxito en preescolar? - Sección Grande Cuaderno 2',
  'Cahier d''activités pour la Grande Section – Livret 2 (2e édition). Couvre : EDHC, Graphisme, Langage, EPS, Lecture, Comptines et Poèmes. Éditions ARE (Africa Reflets Éditions). Conforme au programme officiel ivoirien.',
  'Activity workbook for Large Section – Booklet 2 (2nd edition). Covers: EDHC, Writing, Language, PE, Reading, Rhymes. ARE Editions.',
  'Arbeitsheft für die Große Abteilung – Heft 2 (2. Auflage). Fächer: EDHC, Schreiben, Sprache, Sport, Lesen, Reime. ARE Verlag.',
  'Cuaderno de actividades para Sección Grande – Cuaderno 2 (2ª edición). Materias: EDHC, Grafismo, Lenguaje, EPS, Lectura, Rimas. Ediciones ARE.',
  1800, 1800, 0, 40,
  '/products/maternelle/comment-reussir-gs-livret2.jpg',
  '81b59ff7-67ca-419f-a7de-f7ad31bb1cf0',
  true, false, true,
  'Pluridisciplines', 'Préscolaire - Grande Section', NULL, 'Manuel scolaire',
  'Africa Reflets Éditions (ARE)', NULL, 'Collection Comment Réussir', 'Scolaire'
);

-- 12. Toute la Maternelle PS - Livret Lecture (NEI-CEDA, rouge)
INSERT INTO public.products (
  name_fr, name_en, name_de, name_es,
  description_fr, description_en, description_de, description_es,
  price, original_price, discount_percent, stock,
  image_url, category_id, is_active, is_featured, free_shipping,
  subject, education_level, education_series, product_type,
  brand, author_name, author_details, product_genre
) VALUES (
  'Toute la Maternelle - Petite Section (Lecture/Graphisme/EDHC/Poésies)',
  'All of Preschool - Small Section (Reading/Writing/EDHC/Poetry)',
  'Die ganze Vorschule - Kleine Abteilung (Lesen/Schreiben/EDHC/Poesie)',
  'Toda la Preescolar - Sección Pequeña (Lectura/Grafismo/EDHC/Poesías)',
  'Cahier d''activités Toute la Maternelle pour la Petite Section. Couvre : Lecture, Graphisme, EDHC, Poésies et Comptines. Éditions NEI-CEDA. Conforme au dernier programme officiel. Un cahier pour accompagner votre enfant tout au long de l''année scolaire.',
  'Activity workbook for Small Section. Covers: Reading, Writing, EDHC, Poetry and Nursery Rhymes. NEI-CEDA Editions.',
  'Arbeitsheft für die Kleine Abteilung. Fächer: Lesen, Schreiben, EDHC, Poesie und Reime. NEI-CEDA Verlag.',
  'Cuaderno de actividades para Sección Pequeña. Materias: Lectura, Grafismo, EDHC, Poesías y Rimas. Ediciones NEI-CEDA.',
  1500, 1500, 0, 55,
  '/products/maternelle/toute-la-maternelle-ps-nei-rouge.jpg',
  '81b59ff7-67ca-419f-a7de-f7ad31bb1cf0',
  true, true, true,
  'Lecture', 'Préscolaire - Petite Section', NULL, 'Manuel scolaire',
  'NEI-CEDA', NULL, 'Collection Toute la Maternelle', 'Scolaire'
);

-- 13. Toute la Maternelle PS - Livret Lecture (NEI-CEDA, jaune)
INSERT INTO public.products (
  name_fr, name_en, name_de, name_es,
  description_fr, description_en, description_de, description_es,
  price, original_price, discount_percent, stock,
  image_url, category_id, is_active, is_featured, free_shipping,
  subject, education_level, education_series, product_type,
  brand, author_name, author_details, product_genre
) VALUES (
  'Toute la Maternelle - Petite Section (Édition jaune)',
  'All of Preschool - Small Section (Yellow Edition)',
  'Die ganze Vorschule - Kleine Abteilung (Gelbe Ausgabe)',
  'Toda la Preescolar - Sección Pequeña (Edición amarilla)',
  'Cahier d''activités Toute la Maternelle pour la Petite Section – Édition jaune. Couvre : Lecture, Graphisme, EDHC, Poésies et Comptines. Éditions NEI-CEDA. Conforme au dernier programme officiel de Côte d''Ivoire.',
  'Activity workbook for Small Section – Yellow edition. Covers: Reading, Writing, EDHC, Poetry. NEI-CEDA Editions.',
  'Arbeitsheft für die Kleine Abteilung – Gelbe Ausgabe. NEI-CEDA Verlag.',
  'Cuaderno de actividades para Sección Pequeña – Edición amarilla. Ediciones NEI-CEDA.',
  1500, 1500, 0, 55,
  '/products/maternelle/toute-la-maternelle-ps-nei-jaune.jpg',
  '81b59ff7-67ca-419f-a7de-f7ad31bb1cf0',
  true, false, true,
  'Lecture', 'Préscolaire - Petite Section', NULL, 'Manuel scolaire',
  'NEI-CEDA', NULL, 'Collection Toute la Maternelle', 'Scolaire'
);

-- 14. Toute la Maternelle MS - Livret Lecture (NEI-CEDA, bleu)
INSERT INTO public.products (
  name_fr, name_en, name_de, name_es,
  description_fr, description_en, description_de, description_es,
  price, original_price, discount_percent, stock,
  image_url, category_id, is_active, is_featured, free_shipping,
  subject, education_level, education_series, product_type,
  brand, author_name, author_details, product_genre
) VALUES (
  'Toute la Maternelle - Moyenne Section (Lecture/Graphisme/EDHC/Poésies)',
  'All of Preschool - Middle Section (Reading/Writing/EDHC/Poetry)',
  'Die ganze Vorschule - Mittlere Abteilung (Lesen/Schreiben/EDHC/Poesie)',
  'Toda la Preescolar - Sección Media (Lectura/Grafismo/EDHC/Poesías)',
  'Cahier d''activités Toute la Maternelle pour la Moyenne Section. Couvre : Lecture, Graphisme, EDHC, Poésies et Comptines. Éditions NEI-CEDA. Conforme au dernier programme officiel. Accompagne l''enfant de 4 ans dans son parcours scolaire.',
  'Activity workbook for Middle Section. Covers: Reading, Writing, EDHC, Poetry and Nursery Rhymes. NEI-CEDA Editions.',
  'Arbeitsheft für die Mittlere Abteilung. Fächer: Lesen, Schreiben, EDHC, Poesie. NEI-CEDA Verlag.',
  'Cuaderno de actividades para Sección Media. Materias: Lectura, Grafismo, EDHC, Poesías. Ediciones NEI-CEDA.',
  1500, 1500, 0, 55,
  '/products/maternelle/toute-la-maternelle-ms-nei-bleu.jpg',
  '81b59ff7-67ca-419f-a7de-f7ad31bb1cf0',
  true, false, true,
  'Lecture', 'Préscolaire - Moyenne Section', NULL, 'Manuel scolaire',
  'NEI-CEDA', NULL, 'Collection Toute la Maternelle', 'Scolaire'
);

-- 15. Toute la Maternelle MS - Livret Maths (NEI-CEDA, orange)
INSERT INTO public.products (
  name_fr, name_en, name_de, name_es,
  description_fr, description_en, description_de, description_es,
  price, original_price, discount_percent, stock,
  image_url, category_id, is_active, is_featured, free_shipping,
  subject, education_level, education_series, product_type,
  brand, author_name, author_details, product_genre
) VALUES (
  'Toute la Maternelle - Moyenne Section (Maths/Éveil au Milieu/AEC)',
  'All of Preschool - Middle Section (Maths/Science/AEC)',
  'Die ganze Vorschule - Mittlere Abteilung (Mathe/Naturkunde/AEC)',
  'Toda la Preescolar - Sección Media (Mates/Ciencias/AEC)',
  'Cahier d''activités Toute la Maternelle pour la Moyenne Section. Couvre : Mathématiques, Activités d''Éveil au Milieu et Activités d''Expression et de Création (AEC). Éditions NEI-CEDA. Conforme au dernier programme officiel de Côte d''Ivoire.',
  'Activity workbook for Middle Section. Covers: Mathematics, Science Discovery and Creative Expression (AEC). NEI-CEDA Editions.',
  'Arbeitsheft für die Mittlere Abteilung. Fächer: Mathematik, Naturkunde und Kreativität (AEC). NEI-CEDA Verlag.',
  'Cuaderno de actividades para Sección Media. Materias: Matemáticas, Actividades de Descubrimiento y AEC. Ediciones NEI-CEDA.',
  1500, 1500, 0, 55,
  '/products/maternelle/toute-la-maternelle-ms-nei-maths.jpg',
  '81b59ff7-67ca-419f-a7de-f7ad31bb1cf0',
  true, false, true,
  'Mathématiques', 'Préscolaire - Moyenne Section', NULL, 'Manuel scolaire',
  'NEI-CEDA', NULL, 'Collection Toute la Maternelle', 'Scolaire'
);

-- 16. Toute la Maternelle GS - Livret Lecture (NEI-CEDA, vert)
INSERT INTO public.products (
  name_fr, name_en, name_de, name_es,
  description_fr, description_en, description_de, description_es,
  price, original_price, discount_percent, stock,
  image_url, category_id, is_active, is_featured, free_shipping,
  subject, education_level, education_series, product_type,
  brand, author_name, author_details, product_genre
) VALUES (
  'Toute la Maternelle - Grande Section (Lecture/Graphisme/EDHC/Poésies)',
  'All of Preschool - Large Section (Reading/Writing/EDHC/Poetry)',
  'Die ganze Vorschule - Große Abteilung (Lesen/Schreiben/EDHC/Poesie)',
  'Toda la Preescolar - Sección Grande (Lectura/Grafismo/EDHC/Poesías)',
  'Cahier d''activités Toute la Maternelle pour la Grande Section. Couvre : Lecture, Graphisme, EDHC, Poésies et Comptines. Éditions NEI-CEDA. Conforme au dernier programme officiel. Prépare l''enfant de 5 ans à l''entrée en CP1.',
  'Activity workbook for Large Section. Covers: Reading, Writing, EDHC, Poetry. NEI-CEDA Editions.',
  'Arbeitsheft für die Große Abteilung. Fächer: Lesen, Schreiben, EDHC, Poesie. NEI-CEDA Verlag.',
  'Cuaderno de actividades para Sección Grande. Materias: Lectura, Grafismo, EDHC, Poesías. Ediciones NEI-CEDA.',
  1500, 1500, 0, 55,
  '/products/maternelle/toute-la-maternelle-gs-nei.jpg',
  '81b59ff7-67ca-419f-a7de-f7ad31bb1cf0',
  true, true, true,
  'Lecture', 'Préscolaire - Grande Section', NULL, 'Manuel scolaire',
  'NEI-CEDA', NULL, 'Collection Toute la Maternelle', 'Scolaire'
);

-- 17. Toute la Maternelle GS - Livret Maths (NEI-CEDA, orange)
INSERT INTO public.products (
  name_fr, name_en, name_de, name_es,
  description_fr, description_en, description_de, description_es,
  price, original_price, discount_percent, stock,
  image_url, category_id, is_active, is_featured, free_shipping,
  subject, education_level, education_series, product_type,
  brand, author_name, author_details, product_genre
) VALUES (
  'Toute la Maternelle - Grande Section (Maths/Éveil au Milieu/AEC)',
  'All of Preschool - Large Section (Maths/Science/AEC)',
  'Die ganze Vorschule - Große Abteilung (Mathe/Naturkunde/AEC)',
  'Toda la Preescolar - Sección Grande (Mates/Ciencias/AEC)',
  'Cahier d''activités Toute la Maternelle pour la Grande Section. Couvre : Mathématiques, Activités d''Éveil au Milieu et Activités d''Expression et de Création (AEC). Éditions NEI-CEDA. Conforme au dernier programme officiel de Côte d''Ivoire.',
  'Activity workbook for Large Section. Covers: Mathematics, Science Discovery and Creative Expression. NEI-CEDA Editions.',
  'Arbeitsheft für die Große Abteilung. Fächer: Mathematik, Naturkunde und Kreativität. NEI-CEDA Verlag.',
  'Cuaderno de actividades para Sección Grande. Materias: Matemáticas, Actividades de Descubrimiento y AEC. Ediciones NEI-CEDA.',
  1500, 1500, 0, 55,
  '/products/maternelle/toute-la-maternelle-gs-nei-maths.jpg',
  '81b59ff7-67ca-419f-a7de-f7ad31bb1cf0',
  true, false, true,
  'Mathématiques', 'Préscolaire - Grande Section', NULL, 'Manuel scolaire',
  'NEI-CEDA', NULL, 'Collection Toute la Maternelle', 'Scolaire'
);

-- 18. Toute ma Maternelle Maths GS 5-6 ans (Hachette)
INSERT INTO public.products (
  name_fr, name_en, name_de, name_es,
  description_fr, description_en, description_de, description_es,
  price, original_price, discount_percent, stock,
  image_url, category_id, is_active, is_featured, free_shipping,
  subject, education_level, education_series, product_type,
  brand, author_name, author_details, product_genre
) VALUES (
  'Toute ma Maternelle - Maths Grande Section 5-6 ans',
  'All My Preschool - Maths Large Section 5-6 years',
  'Meine ganze Vorschule - Mathe Große Abteilung 5-6 Jahre',
  'Toda mi Preescolar - Mates Sección Grande 5-6 años',
  'Cahier de mathématiques pour la Grande Section (5-6 ans). Écrit par une enseignante. Contenu : Dénombrement, Tableaux et classement, Formes et tailles, Repérage dans l''espace. Inclus de nombreux autocollants. Conforme au programme. Éditions Hachette Éducation.',
  'Mathematics workbook for Large Section (5-6 years). Written by a teacher. Includes: Counting, Tables and sorting, Shapes and sizes, Spatial orientation. With stickers. Hachette Education.',
  'Mathematik-Arbeitsheft für die Große Abteilung (5-6 Jahre). Von einer Lehrerin geschrieben. Mit Aufklebern. Hachette Verlag.',
  'Cuaderno de matemáticas para Sección Grande (5-6 años). Escrito por una maestra. Incluye pegatinas. Hachette Educación.',
  3500, 3500, 0, 25,
  '/products/maternelle/toute-ma-maternelle-maths-gs-hachette.jpg',
  '81b59ff7-67ca-419f-a7de-f7ad31bb1cf0',
  true, true, true,
  'Mathématiques', 'Préscolaire - Grande Section', NULL, 'Manuel scolaire',
  'Hachette Éducation', NULL, 'Collection Toute ma Maternelle', 'Scolaire'
);

-- 19. Ahoutou à l''école - Premier jour de classe (1ère édition)
INSERT INTO public.products (
  name_fr, name_en, name_de, name_es,
  description_fr, description_en, description_de, description_es,
  price, original_price, discount_percent, stock,
  image_url, category_id, is_active, is_featured, free_shipping,
  subject, education_level, education_series, product_type,
  brand, author_name, author_details, product_genre
) VALUES (
  'Ahoutou à l''école - Premier jour de classe',
  'Ahoutou at School - First Day of Class',
  'Ahoutou in der Schule - Erster Schultag',
  'Ahoutou en la escuela - Primer día de clase',
  'Livre illustré de la Collection Ahoutou. Ahoutou découvre l''école pour la première fois ! Une histoire attachante pour préparer les enfants à la rentrée scolaire. Auteurs : Pauline Gondo et Marguerite Kouamé. Éditions ARE (Africa Reflets Éditions). Idéal pour les enfants en âge préscolaire.',
  'Illustrated book from the Ahoutou Collection. Ahoutou discovers school for the first time! Authors: Pauline Gondo and Marguerite Kouamé. ARE Editions.',
  'Illustriertes Buch der Ahoutou-Sammlung. Ahoutou entdeckt die Schule zum ersten Mal! ARE Verlag.',
  'Libro ilustrado de la Colección Ahoutou. ¡Ahoutou descubre la escuela por primera vez! Ediciones ARE.',
  2000, 2000, 0, 35,
  '/products/maternelle/ahoutou-premier-jour-ed1.jpg',
  '81b59ff7-67ca-419f-a7de-f7ad31bb1cf0',
  true, true, true,
  'Lecture', 'Préscolaire', NULL, 'Œuvre intégrale',
  'Africa Reflets Éditions (ARE)', 'Pauline Gondo, Marguerite Kouamé', 'Collection Ahoutou – ARE', 'Jeunesse'
);

-- 20. Ahoutou à l''école - Premier jour de classe (2e édition)
INSERT INTO public.products (
  name_fr, name_en, name_de, name_es,
  description_fr, description_en, description_de, description_es,
  price, original_price, discount_percent, stock,
  image_url, category_id, is_active, is_featured, free_shipping,
  subject, education_level, education_series, product_type,
  brand, author_name, author_details, product_genre
) VALUES (
  'Ahoutou à l''école - Premier jour de classe (2e édition)',
  'Ahoutou at School - First Day of Class (2nd edition)',
  'Ahoutou in der Schule - Erster Schultag (2. Auflage)',
  'Ahoutou en la escuela - Primer día de clase (2ª edición)',
  'Livre illustré de la Collection Ahoutou – 2e édition enrichie. Ahoutou vit son premier jour d''école avec curiosité et émerveillement. Auteurs : Pauline Gondo et Marguerite Kouamé. Éditions ARE (Africa Reflets Éditions). Nouvelle couverture et illustrations mises à jour.',
  'Illustrated book from the Ahoutou Collection – 2nd enriched edition. Authors: Pauline Gondo and Marguerite Kouamé. ARE Editions.',
  'Illustriertes Buch der Ahoutou-Sammlung – 2. erweiterte Auflage. ARE Verlag.',
  'Libro ilustrado de la Colección Ahoutou – 2ª edición enriquecida. Ediciones ARE.',
  2200, 2200, 0, 35,
  '/products/maternelle/ahoutou-premier-jour-ed2.jpg',
  '81b59ff7-67ca-419f-a7de-f7ad31bb1cf0',
  true, false, true,
  'Lecture', 'Préscolaire', NULL, 'Œuvre intégrale',
  'Africa Reflets Éditions (ARE)', 'Pauline Gondo, Marguerite Kouamé', 'Collection Ahoutou – ARE (2e édition)', 'Jeunesse'
);

-- 21. Ahoutou à l''école - Une journée d''activités (2e édition)
INSERT INTO public.products (
  name_fr, name_en, name_de, name_es,
  description_fr, description_en, description_de, description_es,
  price, original_price, discount_percent, stock,
  image_url, category_id, is_active, is_featured, free_shipping,
  subject, education_level, education_series, product_type,
  brand, author_name, author_details, product_genre
) VALUES (
  'Ahoutou à l''école - Une journée d''activités (2e édition)',
  'Ahoutou at School - A Day of Activities (2nd edition)',
  'Ahoutou in der Schule - Ein Tag voller Aktivitäten (2. Auflage)',
  'Ahoutou en la escuela - Un día de actividades (2ª edición)',
  'Livre illustré de la Collection Ahoutou – 2e édition. Suivez Ahoutou dans une journée d''activités riche en découvertes à l''école. Auteurs : Pauline Gondo et Marguerite Kouamé. Éditions ARE (Africa Reflets Éditions). Une lecture joyeuse pour les tout-petits.',
  'Illustrated book from the Ahoutou Collection – 2nd edition. Follow Ahoutou through a day of school activities. Authors: Pauline Gondo and Marguerite Kouamé. ARE Editions.',
  'Illustriertes Buch der Ahoutou-Sammlung – 2. Auflage. Begleite Ahoutou durch einen Schultag. ARE Verlag.',
  'Libro ilustrado de la Colección Ahoutou – 2ª edición. Acompaña a Ahoutou en un día de actividades escolares. Ediciones ARE.',
  2200, 2200, 0, 35,
  '/products/maternelle/ahoutou-journee-activites.jpg',
  '81b59ff7-67ca-419f-a7de-f7ad31bb1cf0',
  true, false, true,
  'Lecture', 'Préscolaire', NULL, 'Œuvre intégrale',
  'Africa Reflets Éditions (ARE)', 'Pauline Gondo, Marguerite Kouamé', 'Collection Ahoutou – ARE (2e édition)', 'Jeunesse'
);

-- 22. Bibi n''aime pas l''école (Muriel Diallo)
INSERT INTO public.products (
  name_fr, name_en, name_de, name_es,
  description_fr, description_en, description_de, description_es,
  price, original_price, discount_percent, stock,
  image_url, category_id, is_active, is_featured, free_shipping,
  subject, education_level, education_series, product_type,
  brand, author_name, author_details, product_genre
) VALUES (
  'Bibi n''aime pas l''école',
  'Bibi Doesn''t Like School',
  'Bibi mag die Schule nicht',
  'Bibi no le gusta la escuela',
  'Album jeunesse de la collection Les Classiques Ivoiriens. Bibi, une petite fille, n''aime pas aller à l''école. Une histoire tendre et éducative qui aborde les peurs et les résistances des enfants face à l''école. Auteure : Muriel Diallo. Un incontournable de la littérature jeunesse ivoirienne.',
  'Children''s picture book from Les Classiques Ivoiriens collection. Bibi, a little girl, doesn''t like going to school. A tender educational story. Author: Muriel Diallo.',
  'Kinderbuch aus der Sammlung Les Classiques Ivoiriens. Bibi mag nicht zur Schule gehen. Autorin: Muriel Diallo.',
  'Álbum infantil de la colección Les Classiques Ivoiriens. A Bibi no le gusta ir a la escuela. Autora: Muriel Diallo.',
  2500, 2500, 0, 30,
  '/products/maternelle/bibi-naime-pas-ecole.jpg',
  '81b59ff7-67ca-419f-a7de-f7ad31bb1cf0',
  true, true, true,
  'Lecture', 'Préscolaire', NULL, 'Œuvre intégrale',
  'Les Classiques Ivoiriens', 'Muriel Diallo', 'Auteure et illustratrice ivoirienne reconnue', 'Jeunesse'
);

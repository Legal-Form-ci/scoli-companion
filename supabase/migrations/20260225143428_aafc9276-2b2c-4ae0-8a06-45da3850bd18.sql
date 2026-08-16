-- Update articles containing old brand names
UPDATE public.articles SET
  title_fr = REPLACE(REPLACE(REPLACE(REPLACE(title_fr, 'ScoOffice+', 'Scoly'), 'Fournitoo', 'Scoly'), 'Izy-scoly', 'Scoly'), 'Fortuneo', 'Scoly'),
  title_en = REPLACE(REPLACE(REPLACE(REPLACE(title_en, 'ScoOffice+', 'Scoly'), 'Fournitoo', 'Scoly'), 'Izy-scoly', 'Scoly'), 'Fortuneo', 'Scoly'),
  content_fr = REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(content_fr,''), 'ScoOffice+', 'Scoly'), 'Fournitoo', 'Scoly'), 'Izy-scoly', 'Scoly'), 'Fortuneo', 'Scoly'),
  content_en = REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(content_en,''), 'ScoOffice+', 'Scoly'), 'Fournitoo', 'Scoly'), 'Izy-scoly', 'Scoly'), 'Fortuneo', 'Scoly'),
  excerpt_fr = REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(excerpt_fr,''), 'ScoOffice+', 'Scoly'), 'Fournitoo', 'Scoly'), 'Izy-scoly', 'Scoly'), 'Fortuneo', 'Scoly'),
  excerpt_en = REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(excerpt_en,''), 'ScoOffice+', 'Scoly'), 'Fournitoo', 'Scoly'), 'Izy-scoly', 'Scoly'), 'Fortuneo', 'Scoly')
WHERE 
  title_fr ILIKE '%ScoOffice%' OR title_en ILIKE '%ScoOffice%' OR 
  content_fr ILIKE '%ScoOffice%' OR content_en ILIKE '%ScoOffice%' OR
  title_fr ILIKE '%Fournitoo%' OR content_fr ILIKE '%Fournitoo%' OR
  title_fr ILIKE '%Izy-scoly%' OR content_fr ILIKE '%Izy-scoly%' OR
  title_fr ILIKE '%Fortuneo%' OR content_fr ILIKE '%Fortuneo%' OR
  excerpt_fr ILIKE '%ScoOffice%' OR excerpt_en ILIKE '%ScoOffice%' OR
  excerpt_fr ILIKE '%Fournitoo%' OR excerpt_fr ILIKE '%Fortuneo%';

-- Also clean notifications
UPDATE public.notifications SET
  title = REPLACE(REPLACE(REPLACE(REPLACE(title, 'ScoOffice+', 'Scoly'), 'Fournitoo', 'Scoly'), 'Izy-scoly', 'Scoly'), 'Fortuneo', 'Scoly'),
  message = REPLACE(REPLACE(REPLACE(REPLACE(message, 'ScoOffice+', 'Scoly'), 'Fournitoo', 'Scoly'), 'Izy-scoly', 'Scoly'), 'Fortuneo', 'Scoly')
WHERE 
  title ILIKE '%ScoOffice%' OR title ILIKE '%Fournitoo%' OR title ILIKE '%Izy-scoly%' OR title ILIKE '%Fortuneo%' OR
  message ILIKE '%ScoOffice%' OR message ILIKE '%Fournitoo%' OR message ILIKE '%Izy-scoly%' OR message ILIKE '%Fortuneo%';

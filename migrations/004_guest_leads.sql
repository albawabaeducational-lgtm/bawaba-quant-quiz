-- الضيوف والمهتمون: لا يتم تخزين رقم أو اسم إلا إذا أدخله الزائر بنفسه
CREATE TABLE IF NOT EXISTS guest_leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  phone TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'website',
  interest TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TEXT NOT NULL,
  last_contacted_at TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS guest_leads_phone ON guest_leads(phone);
CREATE INDEX IF NOT EXISTS guest_leads_created ON guest_leads(created_at);

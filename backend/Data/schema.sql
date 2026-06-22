-- JRV Impact - PostgreSQL schema
-- Auto-executed by the postgres Docker image on first container start
-- (mounted into /docker-entrypoint-initdb.d/)

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  user_code VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE locations (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  short_code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(150) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE companies (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  short_code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE company_contacts (
  id SERIAL PRIMARY KEY,
  company_id INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  mobile VARCHAR(20) NOT NULL
);

CREATE TABLE job_titles (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  short_code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(150) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  rate NUMERIC(12,2) NOT NULL DEFAULT 0,
  type_tag VARCHAR(10) NOT NULL DEFAULT 'SRV',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE pre_job_sheets (
  id SERIAL PRIMARY KEY,
  code VARCHAR(40) UNIQUE NOT NULL,
  location_id INT NOT NULL REFERENCES locations(id),
  company_id INT NOT NULL REFERENCES companies(id),
  contact_id INT REFERENCES company_contacts(id),
  contact_name VARCHAR(150) NOT NULL,
  mobile VARCHAR(20) NOT NULL,
  sheet_date DATE NOT NULL,
  payment_mode VARCHAR(20) NOT NULL,
  sub_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  gst_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'Pending',
  created_by_user_id INT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE pre_job_sheet_items (
  id SERIAL PRIMARY KEY,
  pre_job_sheet_id INT NOT NULL REFERENCES pre_job_sheets(id) ON DELETE CASCADE,
  job_title_id INT REFERENCES job_titles(id),
  sl_no INT NOT NULL,
  item_name VARCHAR(150) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  qty NUMERIC(12,2) NOT NULL,
  rate NUMERIC(12,2) NOT NULL,
  amount NUMERIC(12,2) NOT NULL
);

CREATE TABLE job_sheets (
  id SERIAL PRIMARY KEY,
  code VARCHAR(40) UNIQUE NOT NULL,
  pre_job_sheet_id INT UNIQUE NOT NULL REFERENCES pre_job_sheets(id),
  location_id INT NOT NULL REFERENCES locations(id),
  company_id INT NOT NULL REFERENCES companies(id),
  contact_id INT REFERENCES company_contacts(id),
  contact_name VARCHAR(150) NOT NULL,
  original_contact_name VARCHAR(150) NOT NULL,
  mobile VARCHAR(20) NOT NULL,
  original_mobile VARCHAR(20) NOT NULL,
  sheet_date DATE NOT NULL,
  payment_mode VARCHAR(20) NOT NULL,
  original_payment_mode VARCHAR(20) NOT NULL,
  sub_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  gst_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  receiver_name VARCHAR(150),
  is_edited BOOLEAN NOT NULL DEFAULT false,
  edited_fields TEXT[] NOT NULL DEFAULT '{}',
  created_by_user_id INT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE job_sheet_items (
  id SERIAL PRIMARY KEY,
  job_sheet_id INT NOT NULL REFERENCES job_sheets(id) ON DELETE CASCADE,
  job_title_id INT REFERENCES job_titles(id),
  sl_no INT NOT NULL,
  item_name VARCHAR(150) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  qty NUMERIC(12,2) NOT NULL,
  original_qty NUMERIC(12,2) NOT NULL,
  rate NUMERIC(12,2) NOT NULL,
  original_rate NUMERIC(12,2) NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  original_amount NUMERIC(12,2) NOT NULL,
  photo_path TEXT,
  is_edited BOOLEAN NOT NULL DEFAULT false,
  edited_fields TEXT[] NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_pjs_location ON pre_job_sheets(location_id);
CREATE INDEX idx_js_location ON job_sheets(location_id);
CREATE INDEX idx_pjs_items_pjs ON pre_job_sheet_items(pre_job_sheet_id);
CREATE INDEX idx_js_items_js ON job_sheet_items(job_sheet_id);
CREATE INDEX idx_company_contacts_company ON company_contacts(company_id);

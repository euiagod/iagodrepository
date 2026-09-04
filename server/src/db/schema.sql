-- Cartel Club — schema principal
-- Autorização é reforçada na camada de aplicação (cada rota confere o dono
-- do recurso via req.user.id), já que este backend não usa PostgREST/RLS.
-- As constraints abaixo (FKs, UNIQUE, CHECK) são a segunda linha de defesa:
-- garantem integridade mesmo se uma rota tiver um bug.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL CHECK (username ~ '^[a-z0-9_\.]{3,24}$'),
  display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 60),
  type text NOT NULL CHECK (type IN ('piloto', 'oficina')),
  avatar_url text,
  bio text CHECK (char_length(bio) <= 280),
  city text CHECK (char_length(city) <= 80),
  state text CHECK (char_length(state) <= 2),
  member_number serial,
  is_verified boolean NOT NULL DEFAULT false,
  specialties text[] DEFAULT '{}',
  address text CHECK (char_length(address) <= 200),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nickname text NOT NULL CHECK (char_length(nickname) BETWEEN 1 AND 60),
  brand text NOT NULL CHECK (char_length(brand) <= 40),
  model text NOT NULL CHECK (char_length(model) <= 40),
  year integer NOT NULL CHECK (year BETWEEN 1950 AND 2100),
  drivetrain text NOT NULL CHECK (drivetrain IN ('dianteira', 'traseira', '4x4')),
  aspiration text NOT NULL CHECK (
    aspiration IN ('aspirado', 'turbo', 'supercharger', 'turbo+supercharger', 'eletrico')
  ),
  engine text CHECK (char_length(engine) <= 60),
  displacement text CHECK (char_length(displacement) <= 30),
  gearbox text CHECK (char_length(gearbox) <= 40),
  suspension text NOT NULL CHECK (
    suspension IN ('original', 'coilover', 'a ar', 'rebaixamento fixo', 'competicao')
  ),
  suspension_detail text CHECK (char_length(suspension_detail) <= 60),
  wheels text CHECK (char_length(wheels) <= 60),
  tires text CHECK (char_length(tires) <= 60),
  brakes text CHECK (char_length(brakes) <= 60),
  hp integer CHECK (hp BETWEEN 0 AND 5000),
  whp integer CHECK (whp BETWEEN 0 AND 5000),
  torque_kgfm numeric(6, 1) CHECK (torque_kgfm BETWEEN 0 AND 500),
  boost_bar numeric(4, 2) CHECK (boost_bar BETWEEN 0 AND 10),
  fuel text CHECK (char_length(fuel) <= 30),
  ecu text CHECK (char_length(ecu) <= 40),
  stage text CHECK (char_length(stage) <= 20),
  build_status text NOT NULL DEFAULT 'original' CHECK (
    build_status IN ('original', 'em construcao', 'pronto para pista', 'show car')
  ),
  is_primary boolean NOT NULL DEFAULT false,
  cover_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cars_owner ON cars(owner_id);

CREATE TABLE IF NOT EXISTS car_mods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id uuid NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (
    category IN ('motor', 'suspensao', 'freios', 'rodas', 'aerodinamica', 'seguranca', 'eletronica')
  ),
  label text NOT NULL CHECK (char_length(label) BETWEEN 1 AND 40)
);

CREATE INDEX IF NOT EXISTS idx_car_mods_car ON car_mods(car_id);

CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  car_id uuid REFERENCES cars(id) ON DELETE SET NULL,
  caption text CHECK (char_length(caption) <= 1000),
  location text CHECK (char_length(location) <= 80),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_posts_author_created ON posts(author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);

CREATE TABLE IF NOT EXISTS post_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  url text NOT NULL,
  position integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_post_media_post ON post_media(post_id, position);

CREATE TABLE IF NOT EXISTS likes (
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 500),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id, created_at);

CREATE TABLE IF NOT EXISTS follows (
  follower_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

CREATE TABLE IF NOT EXISTS swipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  car_id uuid NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  direction text NOT NULL CHECK (direction IN ('like', 'pass', 'boost')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, car_id)
);

CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (user_a < user_b),
  UNIQUE (user_a, user_b)
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (
    type IN ('like', 'comment', 'follow', 'match', 'dyno_homologado', 'lap_record')
  ),
  entity_id uuid,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS dyno_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id uuid NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  whp numeric(6, 1),
  torque_kgfm numeric(6, 1),
  boost_bar numeric(4, 2),
  rpm integer,
  fuel text,
  dyno_shop text,
  dyno_type text,
  gain_vs_oem integer,
  certified_at date,
  auth_hash text UNIQUE,
  document_url text,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'homologado', 'recusado')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dyno_car ON dyno_certificates(car_id);

-- Trilha de auditoria para ações de moderação (homologar dyno, verificar
-- perfil, remover post denunciado etc.) — nunca uma edição silenciosa.
CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Um único carro "principal" por dono: zera o anterior antes de marcar um novo.
CREATE OR REPLACE FUNCTION enforce_single_primary_car() RETURNS trigger AS $$
BEGIN
  IF NEW.is_primary THEN
    UPDATE cars SET is_primary = false
    WHERE owner_id = NEW.owner_id AND id <> NEW.id AND is_primary = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_single_primary_car ON cars;
CREATE TRIGGER trg_single_primary_car
  BEFORE INSERT OR UPDATE OF is_primary ON cars
  FOR EACH ROW WHEN (NEW.is_primary)
  EXECUTE FUNCTION enforce_single_primary_car();

-- Cria o match automaticamente quando duas pessoas dão "like" no carro uma da outra.
CREATE OR REPLACE FUNCTION create_match_on_mutual_like() RETURNS trigger AS $$
DECLARE
  car_owner uuid;
  reciprocal_exists boolean;
  a uuid;
  b uuid;
BEGIN
  IF NEW.direction <> 'like' THEN
    RETURN NEW;
  END IF;

  SELECT owner_id INTO car_owner FROM cars WHERE id = NEW.car_id;
  IF car_owner IS NULL OR car_owner = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- o dono do carro já curtiu (deu like) em algum carro do usuário atual?
  SELECT EXISTS (
    SELECT 1 FROM swipes s
    JOIN cars c ON c.id = s.car_id
    WHERE s.user_id = car_owner AND c.owner_id = NEW.user_id AND s.direction = 'like'
  ) INTO reciprocal_exists;

  IF reciprocal_exists THEN
    a := LEAST(NEW.user_id, car_owner);
    b := GREATEST(NEW.user_id, car_owner);
    INSERT INTO matches (user_a, user_b) VALUES (a, b)
    ON CONFLICT (user_a, user_b) DO NOTHING;

    INSERT INTO notifications (user_id, actor_id, type, entity_id)
    VALUES (NEW.user_id, car_owner, 'match', NEW.car_id),
           (car_owner, NEW.user_id, 'match', NEW.car_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_match_on_like ON swipes;
CREATE TRIGGER trg_match_on_like
  AFTER INSERT ON swipes
  FOR EACH ROW EXECUTE FUNCTION create_match_on_mutual_like();

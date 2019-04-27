DROP TABLE IF EXISTS locations, weather, movies, restaurants;

CREATE TABLE locations (
  id SERIAL PRIMARY KEY,
  search_query VARCHAR(255),
  formatted_query VARCHAR(255),
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  created_at BIGINT
);

CREATE TABLE weather (
  id SERIAL PRIMARY KEY,
  forecast VARCHAR(255),
  time VARCHAR(255),
  location_id INTEGER NOT NULL,
  created_at BIGINT,
  FOREIGN KEY (location_id) REFERENCES locations (id)
);

CREATE TABLE movies (
  id SERIAL PRIMARY KEY,
  location VARCHAR(255),
  title VARCHAR(255),
  overview TEXT,
  average_votes NUMERIC(10, 7),
  total_votes INTEGER,
  image_url VARCHAR(255),
  popularity NUMERIC(10, 7),
  released_on VARCHAR(10),
  location_id INTEGER NOT NULL,
  created_at BIGINT,
  FOREIGN KEY (location_id) REFERENCES locations (id)
);

CREATE TABLE restaurants (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  image_url VARCHAR(255),
  price VARCHAR(4),
  rating NUMERIC(10, 7),
  url VARCHAR,
  location_id INTEGER NOT NULL,
  created_at BIGINT,
  FOREIGN KEY (location_id) REFERENCES locations (id)
);

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO deltav;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO deltav;
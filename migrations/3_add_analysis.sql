CREATE TABLE IF NOT EXISTS study_analysis (
    id SERIAL,
    study_id INTEGER REFERENCES studies (id) ON DELETE SET NULL ON UPDATE CASCADE,
    title VARCHAR(255),
    slug VARCHAR(255),
    body TEXT,
    PRIMARY KEY (id)
);

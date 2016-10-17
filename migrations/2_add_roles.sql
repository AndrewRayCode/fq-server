CREATE TABLE IF NOT EXISTS roles (
    id SERIAL,
    name VARCHAR(50),
    PRIMARY KEY (id)
);

CREATE TABLE user_roles (
    id SERIAL,
    user_id INTEGER REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    role_id INTEGER REFERENCES roles (id) ON DELETE SET NULL ON UPDATE CASCADE,
    PRIMARY KEY (id)
);

CREATE TABLE site_data (
    id SERIAL,
    default_user_role_id INTEGER REFERENCES roles (id),
    PRIMARY KEY (id)
);

INSERT INTO roles ( name ) VALUES ( 'User' );
INSERT INTO roles ( name ) VALUES ( 'Admin' );

INSERT INTO site_data ( default_user_role_id ) VALUES (( SELECT id FROM roles WHERE name = 'User' ));

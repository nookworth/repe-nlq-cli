CREATE TABLE IF NOT EXISTS rent_roll (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    unit TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    sq_ft INTEGER NOT NULL,
    autobill DECIMAL(10,2) NOT NULL,
    deposit DECIMAL(10,2) NOT NULL,
    moved_in DATE,
    lease_ends DATE,
    status TEXT NOT NULL
)

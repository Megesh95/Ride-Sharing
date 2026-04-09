-- Sample queries for Smart Bicycle Sharing System

-- Users
SELECT id, name, email, role, created_at FROM users WHERE email = ?;
SELECT * FROM wallet WHERE user_id = ?;

-- Cycles
SELECT id, name, location, status FROM cycles ORDER BY id;

-- Create booking
INSERT INTO bookings (user_id, cycle_id, start_time, status)
VALUES (?, ?, ?, 'confirmed');

-- Active ride check
SELECT * FROM rides WHERE user_id = ? AND end_time IS NULL;

-- End ride / fare persistence
UPDATE rides SET end_time = ?, fare = ? WHERE id = ?;

-- Wallet deduction
UPDATE wallet SET balance = balance - ? WHERE user_id = ?;

-- Transactions history
SELECT id, amount, type, created_at
FROM transactions
WHERE user_id = ?
ORDER BY created_at DESC;


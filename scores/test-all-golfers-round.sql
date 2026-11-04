-- Run against database/winterleague.db before importing test-all-golfers.csv.
INSERT INTO round (name, start_date, end_date)
SELECT 'Test round - all golfers', '2026-11-02', '2026-11-08'
WHERE NOT EXISTS (
    SELECT 1 FROM round
    WHERE start_date <= '2026-11-02' AND end_date >= '2026-11-02'
);

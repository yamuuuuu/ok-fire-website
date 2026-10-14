BEGIN;
LOCK TABLE visits IN SHARE ROW EXCLUSIVE MODE;
-- Keep the most recently edited schedule; preserve older duplicates as soft-deleted history.
WITH ranked AS (
 SELECT id, ROW_NUMBER() OVER (PARTITION BY inquiry_id ORDER BY updated_at DESC, id DESC) AS position
 FROM visits WHERE deleted_at IS NULL
), archived AS (
 UPDATE visits SET deleted_at = NOW() FROM ranked
 WHERE visits.id = ranked.id AND ranked.position > 1 RETURNING visits.id
)
INSERT INTO admin_activity_logs (action_type, target_type, target_id, created_at)
SELECT 'VISIT_DUPLICATE_ARCHIVED', 'VISIT', id, NOW() FROM archived;
CREATE UNIQUE INDEX visits_one_per_inquiry ON visits (inquiry_id) WHERE deleted_at IS NULL;
COMMIT;

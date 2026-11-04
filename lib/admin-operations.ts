type Row = Record<string, unknown>;
type Query = {
 one: (sql: string, ...params: string[]) => Promise<Row | null>;
 all: (sql: string, ...params: string[]) => Promise<Row[]>;
};

/** Operational queues never expand an administrator's clinical case membership. */
export async function readAdminOperations(actor: {id:string;role:string;status:string}, query: Query, timestamp = new Date().toISOString()) {
 if (actor.role !== 'admin' || actor.status !== 'approved') throw new Error('FORBIDDEN');
 const today = timestamp.slice(0,10);
 const until = new Date(Date.parse(timestamp) + 7 * 86400000).toISOString();
 const assigned = "JOIN case_members m ON m.case_id=c.id AND m.user_id=? AND m.role='coordinator'";
 const expiringWhere = "g.revoked_at IS NULL AND g.expires_at>? AND g.expires_at<=? AND p.status='approved' AND p.role='client'";
 const [globalCounts, reportCounts, questionCount, grantCount, myCases, pending, reports, questions, appointments, expiring, activity, unassigned, draftsMissingReviewer] = await Promise.all([
  query.one(`SELECT
   (SELECT COUNT(*) FROM profiles WHERE role='client' AND status='approved') AS clients,
   (SELECT COUNT(*) FROM profiles WHERE status='pending' AND registered_at IS NOT NULL) AS pending_profiles,
   (SELECT COUNT(*) FROM cases WHERE stage<>'closed') AS active_cases,
   (SELECT COUNT(*) FROM egg_requests WHERE status='pending') AS pending_egg_requests`),
  query.one(`SELECT COALESCE(SUM(r.status='draft'),0) AS draft_reports, COALESCE(SUM(r.status='reviewed'),0) AS ready_reports FROM reports r JOIN cases c ON c.id=r.case_id ${assigned}`,actor.id),
  query.one(`SELECT COUNT(*) AS unanswered FROM questions q JOIN cases c ON c.id=q.case_id ${assigned} WHERE q.reply IS NULL`,actor.id),
  query.one(`SELECT COUNT(*) AS expiring_grants FROM directory_grants g JOIN profiles p ON p.id=g.user_id WHERE ${expiringWhere}`,timestamp,until),
  query.one(`SELECT COUNT(*) AS my_open_cases FROM cases c ${assigned} WHERE c.stage<>'closed'`,actor.id),
  query.all("SELECT id,name,email,role,status,language,jurisdiction,interest,created_at,(SELECT COUNT(*) FROM case_members m WHERE m.user_id=profiles.id) AS membership_count,(SELECT COUNT(*) FROM directory_grants g WHERE g.user_id=profiles.id AND g.revoked_at IS NULL) AS active_grant_count FROM profiles WHERE status='pending' AND registered_at IS NOT NULL ORDER BY created_at ASC,id LIMIT 6"),
  query.all(`SELECT r.id,r.case_id,r.title,r.kind,r.status,r.report_date,r.version,r.source,c.code AS case_code,c.title AS case_title FROM reports r JOIN cases c ON c.id=r.case_id ${assigned} ORDER BY r.created_at DESC,r.id LIMIT 100`,actor.id),
  query.all(`SELECT q.id,q.case_id,q.body,q.created_at,p.name AS author_name,c.code AS case_code,c.title AS case_title FROM questions q JOIN profiles p ON p.id=q.author_id JOIN cases c ON c.id=q.case_id ${assigned} WHERE q.reply IS NULL ORDER BY q.created_at ASC,q.id LIMIT 100`,actor.id),
  query.all(`SELECT e.id,e.case_id,e.title,e.event_date,c.code AS case_code FROM events e JOIN cases c ON c.id=e.case_id ${assigned} WHERE e.kind='appointment' AND e.event_date>=? AND e.event_date<? ORDER BY e.event_date,e.id LIMIT 50`,actor.id,today,until.slice(0,10)),
  query.all(`SELECT g.user_id,g.scope,g.expires_at,p.name FROM directory_grants g JOIN profiles p ON p.id=g.user_id WHERE ${expiringWhere} ORDER BY g.expires_at LIMIT 50`,timestamp,until),
  query.all('SELECT a.id,a.action,a.created_at,p.name AS actor_name FROM audit a LEFT JOIN profiles p ON p.id=a.actor_id ORDER BY a.created_at DESC LIMIT 6'),
  query.all("SELECT c.id,c.code,c.title,c.stage FROM cases c WHERE c.stage<>'closed' AND NOT EXISTS (SELECT 1 FROM case_members m WHERE m.case_id=c.id AND m.role='coordinator') ORDER BY c.updated_at,c.id LIMIT 50"),
  query.all(`SELECT r.id,r.case_id,r.title,c.code AS case_code FROM reports r JOIN cases c ON c.id=r.case_id ${assigned} WHERE r.status='draft' AND NOT EXISTS (SELECT 1 FROM case_members rm JOIN profiles p ON p.id=rm.user_id WHERE rm.case_id=r.case_id AND rm.role='reviewer' AND p.role='reviewer' AND p.status='approved') ORDER BY r.created_at,r.id LIMIT 50`,actor.id),
 ]);
 const counts = Object.fromEntries(Object.entries({...globalCounts,...reportCounts,...questionCount,...grantCount,...myCases}).map(([key,value])=>[key,Number(value)||0]));
 return {counts,pending,reports,questions,appointments,expiring,activity,unassigned,drafts_missing_reviewer:draftsMissingReviewer,generated_at:timestamp};
}

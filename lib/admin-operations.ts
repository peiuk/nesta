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
 const [globalCounts, reportCounts, questionCount, grantCount, pending, reports, questions, appointments, expiring, activity] = await Promise.all([
  query.one(`SELECT
   (SELECT COUNT(*) FROM profiles WHERE role='client' AND status='approved') AS clients,
   (SELECT COUNT(*) FROM profiles WHERE status='pending' AND registered_at IS NOT NULL) AS pending_profiles,
   (SELECT COUNT(*) FROM cases WHERE stage<>'closed') AS active_cases`),
  query.one(`SELECT COALESCE(SUM(r.status='draft'),0) AS draft_reports, COALESCE(SUM(r.status='reviewed'),0) AS ready_reports FROM reports r JOIN cases c ON c.id=r.case_id ${assigned}`,actor.id),
  query.one(`SELECT COUNT(*) AS unanswered FROM questions q JOIN cases c ON c.id=q.case_id ${assigned} WHERE q.reply IS NULL`,actor.id),
  query.one(`SELECT COUNT(*) AS expiring_grants FROM directory_grants g JOIN profiles p ON p.id=g.user_id WHERE ${expiringWhere}`,timestamp,until),
  query.all("SELECT id,name,email,role,status,language,jurisdiction,interest,created_at FROM profiles WHERE status='pending' AND registered_at IS NOT NULL ORDER BY created_at ASC,id LIMIT 6"),
  query.all(`SELECT r.id,r.case_id,r.title,r.kind,r.status,r.report_date,r.version,r.source,c.code AS case_code,c.title AS case_title FROM reports r JOIN cases c ON c.id=r.case_id ${assigned} ORDER BY r.created_at DESC,r.id LIMIT 100`,actor.id),
  query.all(`SELECT q.id,q.case_id,q.body,q.created_at,p.name AS author_name,c.code AS case_code,c.title AS case_title FROM questions q JOIN profiles p ON p.id=q.author_id JOIN cases c ON c.id=q.case_id ${assigned} WHERE q.reply IS NULL ORDER BY q.created_at ASC,q.id LIMIT 100`,actor.id),
  query.all(`SELECT e.id,e.case_id,e.title,e.event_date,c.code AS case_code FROM events e JOIN cases c ON c.id=e.case_id ${assigned} WHERE e.kind='appointment' AND e.event_date>=? AND e.event_date<? ORDER BY e.event_date,e.id LIMIT 50`,actor.id,today,until.slice(0,10)),
  query.all(`SELECT g.user_id,g.scope,g.expires_at,p.name FROM directory_grants g JOIN profiles p ON p.id=g.user_id WHERE ${expiringWhere} ORDER BY g.expires_at LIMIT 50`,timestamp,until),
  query.all('SELECT a.id,a.action,a.created_at,p.name AS actor_name FROM audit a LEFT JOIN profiles p ON p.id=a.actor_id ORDER BY a.created_at DESC LIMIT 6'),
 ]);
 const counts = Object.fromEntries(Object.entries({...globalCounts,...reportCounts,...questionCount,...grantCount}).map(([key,value])=>[key,Number(value)||0]));
 return {counts,pending,reports,questions,appointments,expiring,activity,generated_at:timestamp};
}

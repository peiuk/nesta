type Row=Record<string,any>;
type Query={all:(sql:string,...p:string[])=>Promise<Row[]>;one:(sql:string,...p:string[])=>Promise<Row|null>};
export async function readClientHighlights(actor:{id:string;role:string;status:string},query:Query,today=new Date().toISOString().slice(0,10)){
 if(actor.role!=='client'||actor.status!=='approved')throw new Error('FORBIDDEN');
 const [recent_reports,appointments,selection]=await Promise.all([
  query.all("SELECT r.id,r.case_id,r.title,r.cycle,r.report_date,r.published_at,r.language,r.kind,CASE WHEN r.translation_key IS NOT NULL THEN 1 ELSE 0 END AS has_translation,c.code AS case_code FROM reports r JOIN cases c ON c.id=r.case_id JOIN case_members m ON m.case_id=c.id AND m.user_id=? AND m.role='client' JOIN report_recipients rr ON rr.report_id=r.id AND rr.user_id=m.user_id WHERE r.status='published' ORDER BY r.published_at DESC,r.report_date DESC LIMIT 5",actor.id),
  query.all("SELECT e.id,e.case_id,e.title,e.event_date,c.code AS case_code FROM events e JOIN cases c ON c.id=e.case_id JOIN case_members m ON m.case_id=c.id AND m.user_id=? AND m.role='client' WHERE e.kind='appointment' AND e.event_date>=? ORDER BY e.event_date,e.created_at LIMIT 5",actor.id,today),
  query.one("SELECT COUNT(*) AS pending FROM egg_requests WHERE user_id=? AND status='pending'",actor.id)
 ]);
 return {recent_reports,appointments,pending_selections:Number(selection?.pending||0)};
}

// The caller verifies current directory access before executing this projection.
export function directoryQuery(admin:boolean){
 return `SELECT d.id,d.code,d.kind,d.age,d.height,d.blood_group,d.source,d.summary_zh,d.summary_en,d.status,d.status_reason,d.verified_at${admin?',d.consent_ref':''},CASE WHEN f.user_id IS NULL THEN 0 ELSE 1 END AS favorite FROM donors d LEFT JOIN favorites f ON f.donor_id=d.id AND f.user_id=? WHERE d.kind=? ${admin?'':"AND d.status<>'archived'"} ORDER BY d.code LIMIT 300`;
}

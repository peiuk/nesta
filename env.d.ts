declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    FILES: R2Bucket;
    ADMIN_EMAIL?: string;
    SITE_ORIGIN?: string;
  }
}

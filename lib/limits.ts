/**
 * Single source of truth for upload limits, shared by the client and the server.
 *
 * Sizes are binary (MiB = 1024 * 1024 bytes). User-facing copy is generated from
 * these constants via limitMB() and rounded to whole "MB" to match the wording
 * clients already see. Request ceilings sit slightly above payload ceilings to
 * leave room for the multipart envelope.
 *
 * Report uploads accept two files (original + optional translation), each capped
 * by REPORT_FILE_MAX_BYTES; REPORT_REQUEST_MAX_BYTES covers both plus overhead.
 */
const MiB = 1024 * 1024;

export const REPORT_FILE_MAX_BYTES = 8 * MiB;
export const REPORT_REQUEST_MAX_BYTES = 17 * MiB;

export const DONOR_MEDIA_MAX_ITEMS = 10;
export const DONOR_IMAGE_MAX_BYTES = 5 * MiB;
export const DONOR_PDF_MAX_BYTES = 8 * MiB;
export const DONOR_VIDEO_MAX_BYTES = 50 * MiB;
export const DONOR_MEDIA_BATCH_MAX_BYTES = 100 * MiB;
export const DONOR_MEDIA_REQUEST_MAX_BYTES = 105 * MiB;

/** Whole MiB as a string, for user-facing copy such as "8 MB" or "100 MB". */
export function limitMB(bytes: number) { return String(Math.round(bytes / MiB)) }

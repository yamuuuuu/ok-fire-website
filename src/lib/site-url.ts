export function siteUrl() { const value = process.env.APP_ORIGIN; try { return value ? new URL(value).origin : 'http://localhost:3000'; } catch { return 'http://localhost:3000'; } }
export function absoluteUrl(path = '/') { return new URL(path, siteUrl()).toString(); }

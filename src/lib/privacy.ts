import 'server-only';
export type PrivacyNotice = { retention: string; contact: string; version: string };
export function getPrivacyNotice(): PrivacyNotice | null {
  const retention = process.env.PRIVACY_RETENTION_TEXT?.trim();
  const contact = process.env.PRIVACY_CONTACT_TEXT?.trim();
  const version = process.env.PRIVACY_POLICY_VERSION?.trim();
  if (!retention || !contact || !version || version.length > 100) return null;
  return { retention, contact, version };
}

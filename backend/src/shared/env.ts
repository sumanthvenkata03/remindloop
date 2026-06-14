/**
 * Central env access. Keeping it in one file means swapping plaintext env vars
 * for SSM SecureString later (the recommended hardening) is a one-file change.
 */

export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export function optionalEnv(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

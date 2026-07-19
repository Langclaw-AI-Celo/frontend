type ContentSecurityPolicyOptions = {
  isDevelopment: boolean;
};

export function buildContentSecurityPolicy({
  isDevelopment,
}: ContentSecurityPolicyOptions) {
  const scriptSources = ["'self'", "'unsafe-inline'"];

  if (isDevelopment) {
    scriptSources.push("'unsafe-eval'");
  }

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    `script-src ${scriptSources.join(" ")}`,
    "connect-src 'self' http://localhost:3001 http://43.129.56.85 https: wss:",
    "frame-src 'self' https:",
    "worker-src 'self' blob:",
  ].join("; ");
}

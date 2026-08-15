function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const env = {
  apiBaseUrl: required("API_BASE_URL", process.env.API_BASE_URL),
  apiAdministerBaseUrl: required(
    "API_ADMINISTER_BASE_URL",
    process.env.API_ADMINISTER_BASE_URL,
  ),
  apiProjectId: required("API_PROJECT_ID", process.env.API_PROJECT_ID),
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://dawahnigeria.com",
};

export function testDatabaseUrl(): string {
  const url = process.env.TEST_DATABASE_URL;
  if (url === undefined || url === '') {
    throw new Error('TEST_DATABASE_URL is not set; run integration tests through docker compose');
  }
  return url;
}

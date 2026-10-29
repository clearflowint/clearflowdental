import { Client, Account, Functions, ID } from 'https://cdn.jsdelivr.net/npm/appwrite@17.0.0/+esm';

export const APPWRITE_ENDPOINT = 'https://clearflowappwrite.duckdns.org/v1';
export const APPWRITE_PROJECT_ID = '6adcea89003c9613425b';
export const API_FUNCTION_ID = 'clearflow-dental-api';

const client = new Client().setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID);
const account = new Account(client);
const functions = new Functions(client);

export async function currentUser() {
  try { return await account.get(); } catch { return null; }
}
export async function signInWithGoogle() {
  const redirect = window.location.origin + window.location.pathname;
  account.createOAuth2Session('google', redirect, redirect);
}
export async function signOut() {
  await account.deleteSession('current');
}
export async function callApi(action, payload = {}) {
  const user = await account.get();
  const jwt = await account.createJWT();
  const execution = await functions.createExecution(
    API_FUNCTION_ID,
    JSON.stringify({ action, payload, authContext: { userId: user.$id, jwt: jwt.jwt } }),
    false
  );
  if (execution.statusCode < 200 || execution.statusCode >= 300) {
    let detail = 'Request failed (' + execution.statusCode + ').';
    try { detail = JSON.parse(execution.responseBody || '{}').error || detail; } catch {}
    throw new Error(detail);
  }
  const data = JSON.parse(execution.responseBody || '{}');
  if (!data.ok) throw new Error(data.error || 'The operation could not be completed.');
  return data;
}
export { ID };

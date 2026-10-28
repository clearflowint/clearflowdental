import { Account, Client, ID } from 'appwrite';
const client = new Client().setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://clearflowappwrite.duckdns.org/v1').setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || '6adcea89003c9613425b');
const account = new Account(client);
export async function currentUser(){try{return await account.get()}catch(e){if(e?.code===401||e?.code===404)return null;throw e}}
export async function signIn(email,password){await account.createEmailPasswordSession(email,password);return account.get()}
export async function signUp(name,email,password){await account.create(ID.unique(),email,password,name);await account.createEmailPasswordSession(email,password);return account.get()}
export async function signOut(){await account.deleteSession('current')}

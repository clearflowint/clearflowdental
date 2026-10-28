import { Account, Client, ID, Functions, Storage, Permission, Role } from 'appwrite';
const client = new Client().setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://clearflowappwrite.duckdns.org/v1').setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || '6adcea89003c9613425b');
const account = new Account(client);
const functions = new Functions(client);
const storage = new Storage(client);
export async function currentUser(){try{return await account.get()}catch(e){if(e?.code===401||e?.code===404)return null;throw e}}
export async function signIn(email,password){await account.createEmailPasswordSession(email,password);return account.get()}
export async function signUp(name,email,password){await account.create(ID.unique(),email,password,name);await account.createEmailPasswordSession(email,password);return account.get()}
export async function signOut(){await account.deleteSession('current')}
export async function callApi(action,payload={}){const execution=await functions.createExecution('clearflow-dental-api',JSON.stringify({action,payload}),false,'/','POST');let result;try{result=JSON.parse(execution.responseBody||'{}')}catch{throw new Error('The clinic API returned an invalid response.')}if(!execution.responseStatusCode||execution.responseStatusCode<200||execution.responseStatusCode>=300||result.ok===false)throw new Error(result.error||'Clinic API request failed.');return result}
export async function uploadOriginal(file,userId){return storage.createFile('dental-source-documents',ID.unique(),file,[Permission.read(Role.user(userId))])}
export function originalFileView(fileId){return storage.getFileView('dental-source-documents',fileId)}

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client, TablesDB, Storage } from 'node-appwrite';
const here = path.dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(fs.readFileSync(path.resolve(here, '../../appwrite/schema/prototype-v0.1.json'), 'utf8'));
const { APPWRITE_ENDPOINT:endpoint, APPWRITE_PROJECT_ID:projectId, APPWRITE_API_KEY:apiKey } = process.env;
if (!endpoint || !projectId || !apiKey) throw new Error('Set APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID and APPWRITE_API_KEY in the environment.');
const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const tablesDB = new TablesDB(client), storage = new Storage(client), failures = [];
for (const [tableId, expected] of Object.entries(manifest.tables)) {
  try {
    const actual = await tablesDB.getTable({ databaseId: manifest.databaseId, tableId });
    const columns = new Set((actual.columns || []).map(column => column.key));
    const indexes = new Set((actual.indexes || []).map(index => index.key));
    const missingColumns = expected.columns.filter(key => !columns.has(key));
    const missingIndexes = expected.indexes.filter(key => !indexes.has(key));
    if (actual.rowSecurity !== true) failures.push(tableId + ': row security disabled');
    if ((actual.$permissions || []).length) failures.push(tableId + ': unexpected table permissions');
    if (missingColumns.length) failures.push(tableId + ': missing columns ' + missingColumns.join(', '));
    if (missingIndexes.length) failures.push(tableId + ': missing indexes ' + missingIndexes.join(', '));
    console.log('OK ' + tableId + ': ' + columns.size + ' columns, ' + indexes.size + ' indexes');
  } catch (e) { failures.push(tableId + ': ' + (e?.message || 'read failed')); }
}
try {
  const bucket = await storage.getBucket({ bucketId: manifest.storage.bucketId });
  if (bucket.fileSecurity !== true) failures.push('source bucket: file security disabled');
  if (Number(bucket.maximumFileSize) !== manifest.storage.maximumFileSize) failures.push('source bucket: size limit mismatch');
  const allowed = new Set(bucket.allowedFileExtensions || []);
  for (const ext of manifest.storage.allowedFileExtensions) if (!allowed.has(ext)) failures.push('source bucket: missing extension ' + ext);
  console.log('OK source bucket');
} catch (e) { failures.push('source bucket: ' + (e?.message || 'read failed')); }
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
else console.log('Prototype schema matches the manifest.');

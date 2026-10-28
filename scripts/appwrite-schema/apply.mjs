import { Client, TablesDB } from 'node-appwrite';

const { APPWRITE_ENDPOINT:endpoint, APPWRITE_PROJECT_ID:projectId, APPWRITE_API_KEY:apiKey } = process.env;
const databaseId = 'clearflow_dental';
if (!endpoint || !projectId || !apiKey) throw new Error('Set APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID and APPWRITE_API_KEY in the environment.');
const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const db = new TablesDB(client);

// Keep live security rules aligned with the repository: row security enabled,
// no table-wide grants. Never weaken row security to make a query succeed.
const tableIds = [
  'clinics','clinic_memberships','patients','patient_contacts','patient_documents',
  'appointments','encounters','encounter_treatments','clinical_drafts','activity_events'
];
for (const tableId of tableIds) {
  const table = await db.getTable({ databaseId, tableId });
  if (table.rowSecurity !== true || (table.$permissions || []).length > 0) {
    await db.updateTable({
      databaseId, tableId, name: table.name,
      permissions: [],
      rowSecurity: true
    });
    console.log('Hardened table permission baseline: ' + tableId);
  } else {
    console.log('OK table permission baseline: ' + tableId);
  }
}

const memberships = await db.getTable({ databaseId, tableId: 'clinic_memberships' });
if (!(memberships.indexes || []).some(index => index.key === 'user_status')) {
  await db.createIndex({
    databaseId,
    tableId: 'clinic_memberships',
    key: 'user_status',
    type: 'key',
    columns: ['userId', 'status'],
    orders: ['ASC', 'ASC']
  });
  console.log('Created required query index: clinic_memberships.user_status');
} else {
  console.log('OK query index: clinic_memberships.user_status');
}

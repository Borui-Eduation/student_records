/**
 * Migration Script: Add userId field to existing documents
 * 
 * This script adds the userId field to all existing documents in collections
 * that now require multi-tenancy isolation.
 * 
 * Usage: node scripts/migrate-add-userid.js
 * 
 * WARNING: This is for testing/development only. 
 * Production should start with a clean database.
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '../vercel-service-account.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Get the default user ID from environment or use first admin email
const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID || 'REPLACE_WITH_ADMIN_UID';

const collections = [
  'clients',
  'rates', 
  'sessions',
  'invoices',
  'knowledgeBase',
  'sharingLinks',
];

async function migrateCollection(collectionName) {
  console.log(`\nMigrating ${collectionName}...`);
  
  const snapshot = await db.collection(collectionName).get();
  const batch = db.batch();
  let count = 0;
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    
    // Skip if userId already exists
    if (data.userId) {
      continue;
    }
    
    // Add userId field
    batch.update(doc.ref, {
      userId: DEFAULT_USER_ID,
    });
    
    count++;
    
    // Commit in batches of 500
    if (count % 500 === 0) {
      await batch.commit();
      console.log(`  Updated ${count} documents...`);
    }
  }
  
  // Commit remaining
  if (count % 500 !== 0) {
    await batch.commit();
  }
  
  console.log(`✓ Migrated ${count} documents in ${collectionName}`);
}

async function migrateCompanyProfile() {
  console.log(`\nMigrating companyProfile...`);
  
  // Get the 'default' profile
  const defaultDoc = await db.collection('companyProfile').doc('default').get();
  
  if (!defaultDoc.exists) {
    console.log('  No default company profile found, skipping');
    return;
  }
  
  // Create user-specific profile
  const data = defaultDoc.data();
  await db.collection('companyProfile').doc(DEFAULT_USER_ID).set(data);
  
  // Optionally delete old default doc
  // await defaultDoc.ref.delete();
  
  console.log(`✓ Migrated company profile to user ${DEFAULT_USER_ID}`);
}

async function createUsersCollection() {
  console.log(`\nCreating users collection...`);
  
  // Check if user document already exists
  const userDoc = await db.collection('users').doc(DEFAULT_USER_ID).get();
  
  if (userDoc.exists) {
    console.log('  User document already exists, skipping');
    return;
  }
  
  // Create user document
  await db.collection('users').doc(DEFAULT_USER_ID).set({
    email: process.env.SUPER_ADMIN_EMAIL || 'admin@example.com',
    role: 'superadmin',
    createdAt: admin.firestore.Timestamp.now(),
    lastLoginAt: admin.firestore.Timestamp.now(),
    isInitialized: true,
  });
  
  console.log(`✓ Created user document for ${DEFAULT_USER_ID}`);
}

async function main() {
  console.log('=================================');
  console.log('Multi-Tenant Migration Script');
  console.log('=================================');
  console.log(`Default User ID: ${DEFAULT_USER_ID}`);
  
  if (DEFAULT_USER_ID === 'REPLACE_WITH_ADMIN_UID') {
    console.error('\nERROR: Please set DEFAULT_USER_ID environment variable or edit this script');
    console.error('Usage: DEFAULT_USER_ID=your-firebase-uid node scripts/migrate-add-userid.js');
    process.exit(1);
  }
  
  try {
    // Create users collection
    await createUsersCollection();
    
    // Migrate all collections
    for (const collection of collections) {
      await migrateCollection(collection);
    }
    
    // Migrate company profile
    await migrateCompanyProfile();
    
    console.log('\n=================================');
    console.log('Migration completed successfully!');
    console.log('=================================\n');
    
  } catch (error) {
    console.error('\nMigration failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

main();


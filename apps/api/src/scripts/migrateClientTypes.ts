/**
 * Data Migration Script: Client Type Personalization
 * 
 * This script migrates existing clients from the old enum-based type system
 * to the new user-defined ClientType system.
 * 
 * What it does:
 * 1. For each user, fetches all unique client.type values (old enum system)
 * 2. Creates default ClientType documents for each unique value
 * 3. Updates all client documents with the new clientTypeId reference
 * 4. Creates default SessionType documents (Education, Technical)
 * 5. Logs migration results
 * 
 * How to run:
 * npx ts-node apps/api/src/scripts/migrateClientTypes.ts
 * 
 * IMPORTANT: Backup your Firestore database before running this script!
 */

import * as admin from 'firebase-admin';
import * as path from 'path';

// Initialize Firebase Admin (adjust path to your service account key)
const serviceAccountPath = path.join(__dirname, '../../../service-account-key.json');
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

interface MigrationStats {
  usersProcessed: number;
  clientTypesCreated: number;
  clientsUpdated: number;
  sessionTypesCreated: number;
  errors: string[];
}

async function migrateClientTypes(): Promise<void> {
  const stats: MigrationStats = {
    usersProcessed: 0,
    clientTypesCreated: 0,
    clientsUpdated: 0,
    sessionTypesCreated: 0,
    errors: [],
  };

  console.log('🚀 Starting Client Type Migration...\n');

  try {
    // Get all unique users from clients collection
    const clientsSnapshot = await db.collection('clients').get();
    const userIds = new Set<string>();

    clientsSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.userId) {
        userIds.add(data.userId);
      }
    });

    console.log(`Found ${userIds.size} users with clients\n`);

    // Process each user
    for (const userId of userIds) {
      try {
        await migrateUserData(userId, stats);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        stats.errors.push(`Error processing user ${userId}: ${errorMsg}`);
        console.error(`❌ Error processing user ${userId}:`, error);
      }
    }

    // Print summary
    console.log('\n📊 Migration Summary:');
    console.log(`   Users processed: ${stats.usersProcessed}`);
    console.log(`   Client types created: ${stats.clientTypesCreated}`);
    console.log(`   Clients updated: ${stats.clientsUpdated}`);
    console.log(`   Session types created: ${stats.sessionTypesCreated}`);

    if (stats.errors.length > 0) {
      console.log(`\n⚠️  Errors encountered: ${stats.errors.length}`);
      stats.errors.forEach((err) => console.log(`   - ${err}`));
    } else {
      console.log('\n✅ Migration completed successfully!');
    }
  } catch (error) {
    console.error('Fatal error during migration:', error);
    process.exit(1);
  } finally {
    await admin.app().delete();
  }
}

async function migrateUserData(userId: string, stats: MigrationStats): Promise<void> {
  console.log(`📝 Processing user: ${userId}`);

  // 1. Get all unique client types for this user
  const clientsSnapshot = await db
    .collection('clients')
    .where('userId', '==', userId)
    .get();

  const uniqueTypes = new Set<string>();
  const clientTypeMap = new Map<string, string>(); // Maps old type to new clientTypeId

  clientsSnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.type) {
      uniqueTypes.add(data.type);
    }
  });

  console.log(`   Found ${uniqueTypes.size} unique client types`);

  // 2. Create ClientType documents for each unique type
  for (const typeName of uniqueTypes) {
    try {
      const clientTypeRef = await db.collection('clientTypes').add({
        userId,
        name: typeName.charAt(0).toUpperCase() + typeName.slice(1), // Capitalize
        color: '#' + Math.floor(Math.random() * 16777215).toString(16), // Random color
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
      });

      clientTypeMap.set(typeName, clientTypeRef.id);
      stats.clientTypesCreated++;
      console.log(`   ✓ Created ClientType: ${typeName} (${clientTypeRef.id})`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      stats.errors.push(
        `Failed to create ClientType ${typeName} for user ${userId}: ${errorMsg}`
      );
      console.error(`   ❌ Failed to create ClientType ${typeName}:`, error);
    }
  }

  // 3. Update all clients with new clientTypeId
  for (const clientDoc of clientsSnapshot.docs) {
    try {
      const clientData = clientDoc.data();
      const oldType = clientData.type;
      const newClientTypeId = clientTypeMap.get(oldType);

      if (newClientTypeId) {
        await clientDoc.ref.update({
          clientTypeId: newClientTypeId,
          // Optionally remove the old type field
          type: admin.firestore.FieldValue.delete(),
        });

        stats.clientsUpdated++;
        console.log(`   ✓ Updated client ${clientDoc.id}: ${oldType} → ${newClientTypeId}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      stats.errors.push(`Failed to update client ${clientDoc.id}: ${errorMsg}`);
      console.error(`   ❌ Failed to update client:`, error);
    }
  }

  // 4. Create default SessionTypes if they don't exist
  try {
    const sessionTypesSnapshot = await db
      .collection('sessionTypes')
      .where('userId', '==', userId)
      .get();

    if (sessionTypesSnapshot.empty) {
      const defaultSessionTypes = ['Education', 'Technical'];

      for (const typeName of defaultSessionTypes) {
        const sessionTypeRef = await db.collection('sessionTypes').add({
          userId,
          name: typeName,
          createdAt: admin.firestore.Timestamp.now(),
          updatedAt: admin.firestore.Timestamp.now(),
        });

        stats.sessionTypesCreated++;
        console.log(`   ✓ Created SessionType: ${typeName} (${sessionTypeRef.id})`);
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    stats.errors.push(`Failed to create SessionTypes for user ${userId}: ${errorMsg}`);
    console.error(`   ❌ Failed to create SessionTypes:`, error);
  }

  stats.usersProcessed++;
  console.log(`✅ Finished processing user ${userId}\n`);
}

// Run the migration
migrateClientTypes().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});


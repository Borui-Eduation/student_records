#!/usr/bin/env node

/**
 * Fix broken timestamp fields in expenses collection
 * This script finds expenses with broken timestamp objects and converts them back to proper Timestamps
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '../service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
    projectId: 'borui-education-c6666',
  });
}

const db = admin.firestore();

async function fixBrokenTimestamps() {
  try {
    console.log('🔍 Scanning expenses for broken timestamps...\n');
    
    const snapshot = await db.collection('expenses').get();
    
    if (snapshot.empty) {
      console.log('📭 No expenses found');
      process.exit(0);
    }

    let fixedCount = 0;
    const batch = db.batch();
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      let needsUpdate = false;
      const updates = {};
      
      // Check date field
      if (data.date && typeof data.date === 'object' && !data.date.toDate) {
        if (data.date._seconds !== undefined) {
          console.log(`📅 Fixing date for expense: ${doc.id} (${data.description})`);
          updates.date = admin.firestore.Timestamp.fromMillis(data.date._seconds * 1000 + (data.date._nanoseconds || 0) / 1000000);
          needsUpdate = true;
        }
      }
      
      // Check createdAt field
      if (data.createdAt && typeof data.createdAt === 'object' && !data.createdAt.toDate) {
        if (data.createdAt._seconds !== undefined) {
          console.log(`⏰ Fixing createdAt for expense: ${doc.id} (${data.description})`);
          updates.createdAt = admin.firestore.Timestamp.fromMillis(data.createdAt._seconds * 1000 + (data.createdAt._nanoseconds || 0) / 1000000);
          needsUpdate = true;
        }
      }
      
      // Check updatedAt field
      if (data.updatedAt && typeof data.updatedAt === 'object' && !data.updatedAt.toDate) {
        if (data.updatedAt._seconds !== undefined) {
          console.log(`⏰ Fixing updatedAt for expense: ${doc.id} (${data.description})`);
          updates.updatedAt = admin.firestore.Timestamp.fromMillis(data.updatedAt._seconds * 1000 + (data.updatedAt._nanoseconds || 0) / 1000000);
          needsUpdate = true;
        }
      }
      
      if (needsUpdate) {
        batch.update(doc.ref, updates);
        fixedCount++;
      }
    });
    
    if (fixedCount > 0) {
      console.log(`\n💾 Committing fixes for ${fixedCount} expense(s)...`);
      await batch.commit();
      console.log('✅ All timestamps fixed successfully!');
    } else {
      console.log('✨ No broken timestamps found. All expenses are OK!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

fixBrokenTimestamps();


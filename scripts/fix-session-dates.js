#!/usr/bin/env node

/**
 * Script to fix timezone issues in session dates
 * 修复session日期的时区问题
 */

const path = require('path');

// Load firebase-admin from apps/api node_modules
const admin = require(path.join(__dirname, '../apps/api/node_modules/firebase-admin'));

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '../service-account-key.json');
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function fixSessionDates() {
  console.log('🔍 Fixing session dates...\n');
  
  try {
    const sessionsSnapshot = await db.collection('sessions').get();
    
    if (sessionsSnapshot.empty) {
      console.log('No sessions found');
      process.exit(0);
    }
    
    let fixedCount = 0;
    const batch = db.batch();
    let batchCount = 0;
    
    for (const doc of sessionsSnapshot.docs) {
      const data = doc.data();
      const oldDate = data.date?.toDate();
      
      if (!oldDate) {
        console.log(`⚠️  Skipping ${doc.id}: no date field`);
        continue;
      }
      
      // Extract the date components
      const year = oldDate.getUTCFullYear();
      const month = oldDate.getUTCMonth(); // 0-indexed
      const day = oldDate.getUTCDate();
      
      // Create new date at noon local time
      const newDate = new Date(year, month, day, 12, 0, 0);
      
      console.log(`📅 ${doc.id}: ${oldDate.toISOString()} -> ${newDate.toISOString()}`);
      
      batch.update(doc.ref, {
        date: admin.firestore.Timestamp.fromDate(newDate),
        updatedAt: admin.firestore.Timestamp.now(),
      });
      
      fixedCount++;
      batchCount++;
      
      // Firestore batch limit is 500 operations
      if (batchCount >= 500) {
        await batch.commit();
        console.log(`✅ Committed batch of ${batchCount} updates\n`);
        batchCount = 0;
      }
    }
    
    // Commit remaining updates
    if (batchCount > 0) {
      await batch.commit();
      console.log(`✅ Committed final batch of ${batchCount} updates\n`);
    }
    
    console.log(`\n✅ Fixed ${fixedCount} session dates!`);
    
  } catch (error) {
    console.error('❌ Error fixing session dates:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run the script
fixSessionDates();


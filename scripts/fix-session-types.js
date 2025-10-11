#!/usr/bin/env node

/**
 * Script to add default sessionType to existing sessions that don't have one
 * 为没有sessionType的旧session记录添加默认类型
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

async function fixSessionTypes() {
  console.log('🔍 Checking for sessions without sessionType...');
  
  try {
    const sessionsRef = db.collection('sessions');
    const snapshot = await sessionsRef.get();
    
    let updatedCount = 0;
    let alreadyHaveType = 0;
    const batch = db.batch();
    let batchCount = 0;
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Check if sessionType is missing
      if (!data.sessionType) {
        console.log(`  📝 Session ${doc.id} missing sessionType, setting to 'education'`);
        batch.update(doc.ref, { 
          sessionType: 'education',
          updatedAt: admin.firestore.Timestamp.now()
        });
        updatedCount++;
        batchCount++;
        
        // Firestore batch limit is 500 operations
        if (batchCount >= 500) {
          await batch.commit();
          console.log(`  ✅ Committed batch of ${batchCount} updates`);
          batchCount = 0;
        }
      } else {
        alreadyHaveType++;
      }
    }
    
    // Commit remaining updates
    if (batchCount > 0) {
      await batch.commit();
      console.log(`  ✅ Committed final batch of ${batchCount} updates`);
    }
    
    console.log('\n📊 Summary:');
    console.log(`  Total sessions: ${snapshot.size}`);
    console.log(`  Already have sessionType: ${alreadyHaveType}`);
    console.log(`  Updated with default 'education': ${updatedCount}`);
    console.log('\n✅ Done!');
    
  } catch (error) {
    console.error('❌ Error fixing session types:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run the script
fixSessionTypes();


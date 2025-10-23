#!/usr/bin/env node

/**
 * Check user role in Firestore
 * Usage: node scripts/check-user-role.js <email>
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

async function checkUserRole(email) {
  try {
    console.log(`🔍 Looking for user with email: ${email}`);
    
    // Find user by email
    const usersSnapshot = await db.collection('users')
      .where('email', '==', email)
      .get();

    if (usersSnapshot.empty) {
      console.log(`❌ No user found with email: ${email}`);
      console.log('\n💡 This user has not logged in yet.');
      console.log('   Please log in first, then run this script again.');
      process.exit(1);
    }

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();
    
    console.log(`\n✅ User found!`);
    console.log(`   Email: ${userData.email}`);
    console.log(`   Role: ${userData.role || 'user'}`);
    console.log(`   User ID: ${userDoc.id}`);
    console.log(`   Created: ${userData.createdAt?.toDate?.() || 'Unknown'}`);
    console.log(`   Last Login: ${userData.lastLoginAt?.toDate?.() || 'Unknown'}`);
    console.log(`   Is New User: ${userData.isNewUser || false}`);
    console.log(`   Is Initialized: ${userData.isInitialized || false}`);
    
    console.log(`\n📝 Access Permissions:`);
    if (userData.role === 'superadmin') {
      console.log(`   ✅ Can access dashboard`);
      console.log(`   ✅ Can manage expenses`);
      console.log(`   ✅ Can manage users`);
      console.log(`   ✅ Full system access`);
    } else if (userData.role === 'admin') {
      console.log(`   ✅ Can access dashboard`);
      console.log(`   ✅ Can manage expenses`);
      console.log(`   ❌ Cannot manage users`);
    } else {
      console.log(`   ❌ Cannot access dashboard`);
      console.log(`   ❌ Cannot manage expenses`);
      console.log(`   ❌ Cannot manage users`);
      console.log(`\n💡 To grant access, run:`);
      console.log(`   node scripts/set-superadmin.js ${email} admin`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.log('Usage: node scripts/check-user-role.js <email>');
  console.log('');
  console.log('Example:');
  console.log('  node scripts/check-user-role.js user@example.com');
  process.exit(1);
}

checkUserRole(email);


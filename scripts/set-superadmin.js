/**
 * Set a user as superadmin
 * Usage: node scripts/set-superadmin.js <email>
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '..', 'service-account-key.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

const db = admin.firestore();

async function setSuperAdmin(email) {
  try {
    console.log(`🔍 Looking for user with email: ${email}`);
    
    // Find user by email
    const usersSnapshot = await db.collection('users')
      .where('email', '==', email)
      .get();

    if (usersSnapshot.empty) {
      console.log(`❌ No user found with email: ${email}`);
      console.log('\n💡 Make sure the user has logged in at least once.');
      process.exit(1);
    }

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();
    
    console.log(`✅ Found user: ${userData.email}`);
    console.log(`   Current role: ${userData.role || 'user'}`);
    
    if (userData.role === 'superadmin') {
      console.log(`✨ User is already a superadmin!`);
      process.exit(0);
    }

    // Update role to superadmin
    await userDoc.ref.update({
      role: 'superadmin',
      updatedAt: admin.firestore.Timestamp.now(),
    });

    console.log(`🎉 Successfully set ${email} as superadmin!`);
    console.log(`\n📝 Next steps:`);
    console.log(`   1. Refresh your browser`);
    console.log(`   2. You should now see "User Management" in the sidebar`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.log('Usage: node scripts/set-superadmin.js <email>');
  console.log('Example: node scripts/set-superadmin.js yao.s.1216@gmail.com');
  process.exit(1);
}

setSuperAdmin(email);


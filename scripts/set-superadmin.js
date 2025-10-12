/**
 * Set a user role (admin or superadmin)
 * Usage: 
 *   node scripts/set-superadmin.js <email> [role]
 *   role can be 'admin' or 'superadmin' (default: 'admin')
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

async function setUserRole(email, role = 'admin') {
  try {
    // Validate role
    const validRoles = ['user', 'admin', 'superadmin'];
    if (!validRoles.includes(role)) {
      console.log(`❌ Invalid role: ${role}`);
      console.log(`   Valid roles: ${validRoles.join(', ')}`);
      process.exit(1);
    }

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
    
    if (userData.role === role) {
      console.log(`✨ User already has role: ${role}`);
      process.exit(0);
    }

    // Update role
    await userDoc.ref.update({
      role: role,
      updatedAt: admin.firestore.Timestamp.now(),
    });

    console.log(`🎉 Successfully set ${email} as ${role}!`);
    console.log(`\n📝 Role Permissions:`);
    console.log(`   • user: Cannot access dashboard`);
    console.log(`   • admin: Can access dashboard and manage own data`);
    console.log(`   • superadmin: Full access, can manage all users`);
    console.log(`\n🔄 Next steps:`);
    console.log(`   1. Refresh your browser`);
    if (role === 'admin' || role === 'superadmin') {
      console.log(`   2. You should now be able to access the dashboard`);
    }
    if (role === 'superadmin') {
      console.log(`   3. You should see "User Management" in the sidebar`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Get email and role from command line arguments
const email = process.argv[2];
const role = process.argv[3] || 'admin';

if (!email) {
  console.log('Usage: node scripts/set-superadmin.js <email> [role]');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/set-superadmin.js user@example.com admin');
  console.log('  node scripts/set-superadmin.js user@example.com superadmin');
  console.log('');
  console.log('Roles:');
  console.log('  user        - Default role, cannot access dashboard');
  console.log('  admin       - Can access dashboard and manage own data');
  console.log('  superadmin  - Full system access, can manage all users');
  process.exit(1);
}

setUserRole(email, role);


#!/usr/bin/env node

/**
 * Check expenses in Firestore
 * Usage: node scripts/check-expenses.js [email]
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

async function checkExpenses(email) {
  try {
    let userId = null;
    
    if (email) {
      console.log(`🔍 Looking for user with email: ${email}`);
      
      // Find user by email
      const usersSnapshot = await db.collection('users')
        .where('email', '==', email)
        .get();

      if (usersSnapshot.empty) {
        console.log(`❌ No user found with email: ${email}`);
        process.exit(1);
      }

      userId = usersSnapshot.docs[0].id;
      console.log(`✅ Found user ID: ${userId}\n`);
    }

    // Query expenses
    let query = db.collection('expenses');
    
    if (userId) {
      query = query.where('userId', '==', userId);
    }
    
    // Get recent expenses (last 10)
    const snapshot = await query
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    if (snapshot.empty) {
      console.log('📭 No expenses found');
      if (userId) {
        console.log(`   for user: ${email}`);
      }
      process.exit(0);
    }

    console.log(`📊 Found ${snapshot.size} recent expense(s):\n`);
    
    snapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`${index + 1}. Expense ID: ${doc.id}`);
      console.log(`   Description: ${data.description || 'N/A'}`);
      console.log(`   Amount: ${data.currency || 'CNY'} ${data.amount || 0}`);
      console.log(`   Category: ${data.categoryName || data.category || 'N/A'}`);
      console.log(`   Merchant: ${data.merchant || 'N/A'}`);
      console.log(`   Date: ${data.date?.toDate?.() || 'N/A'}`);
      console.log(`   Created: ${data.createdAt?.toDate?.() || 'N/A'}`);
      console.log(`   User ID: ${data.userId || 'N/A'}`);
      console.log('');
    });
    
    // Also check total count
    const countSnapshot = await (userId 
      ? db.collection('expenses').where('userId', '==', userId).get()
      : db.collection('expenses').get());
    
    console.log(`📈 Total expenses${userId ? ' for this user' : ''}: ${countSnapshot.size}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.log('Checking all expenses (no email filter)...\n');
}

checkExpenses(email);


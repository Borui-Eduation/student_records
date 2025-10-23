#!/usr/bin/env node

/**
 * Check expense detail in Firestore
 * Usage: node scripts/check-expense-detail.js <expenseId>
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

async function checkExpenseDetail(expenseId) {
  try {
    console.log(`🔍 Looking for expense: ${expenseId}\n`);
    
    const doc = await db.collection('expenses').doc(expenseId).get();

    if (!doc.exists) {
      console.log(`❌ Expense not found: ${expenseId}`);
      process.exit(1);
    }

    const data = doc.data();
    
    console.log(`✅ Expense found!\n`);
    console.log('📋 Full data:');
    console.log(JSON.stringify(data, null, 2));
    
    console.log('\n📅 Date field details:');
    console.log('  Type:', typeof data.date);
    console.log('  Value:', data.date);
    if (data.date && typeof data.date === 'object') {
      console.log('  Constructor:', data.date.constructor.name);
      console.log('  Has toDate:', typeof data.date.toDate === 'function');
      if (typeof data.date.toDate === 'function') {
        console.log('  toDate():', data.date.toDate());
      }
      console.log('  _seconds:', data.date._seconds);
      console.log('  _nanoseconds:', data.date._nanoseconds);
    }
    
    console.log('\n⏰ CreatedAt field details:');
    console.log('  Type:', typeof data.createdAt);
    console.log('  Value:', data.createdAt);
    if (data.createdAt && typeof data.createdAt === 'object') {
      console.log('  Constructor:', data.createdAt.constructor.name);
      console.log('  Has toDate:', typeof data.createdAt.toDate === 'function');
      if (typeof data.createdAt.toDate === 'function') {
        console.log('  toDate():', data.createdAt.toDate());
      }
      console.log('  _seconds:', data.createdAt._seconds);
      console.log('  _nanoseconds:', data.createdAt._nanoseconds);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Get expense ID from command line arguments
const expenseId = process.argv[2];

if (!expenseId) {
  console.log('Usage: node scripts/check-expense-detail.js <expenseId>');
  console.log('');
  console.log('Example:');
  console.log('  node scripts/check-expense-detail.js NbjGb4M1zrklMM6Qf5fRj');
  process.exit(1);
}

checkExpenseDetail(expenseId);


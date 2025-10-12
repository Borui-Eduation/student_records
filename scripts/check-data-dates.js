#!/usr/bin/env node

/**
 * Script to check the dates of expenses and sessions in the database
 * 检查数据库中expense和session的日期
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

async function checkDataDates() {
  console.log('🔍 Checking dates in database...\n');
  
  try {
    // Check expenses
    console.log('📊 EXPENSES:');
    const expensesSnapshot = await db.collection('expenses')
      .orderBy('date', 'desc')
      .limit(10)
      .get();
    
    if (expensesSnapshot.empty) {
      console.log('  No expenses found');
    } else {
      expensesSnapshot.forEach(doc => {
        const data = doc.data();
        const date = data.date?.toDate();
        console.log(`  - ${doc.id}: ${date?.toISOString().split('T')[0]} (${date?.toDateString()}) - ¥${data.amount} - ${data.description || 'No description'}`);
      });
    }
    
    // Check sessions
    console.log('\n📅 SESSIONS:');
    const sessionsSnapshot = await db.collection('sessions')
      .orderBy('date', 'desc')
      .limit(10)
      .get();
    
    if (sessionsSnapshot.empty) {
      console.log('  No sessions found');
    } else {
      sessionsSnapshot.forEach(doc => {
        const data = doc.data();
        const date = data.date?.toDate();
        console.log(`  - ${doc.id}: ${date?.toISOString().split('T')[0]} (${date?.toDateString()}) - ${data.clientName || 'No client'} - ¥${data.totalAmount}`);
      });
    }
    
    // Check invoices
    console.log('\n🧾 INVOICES:');
    const invoicesSnapshot = await db.collection('invoices')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();
    
    if (invoicesSnapshot.empty) {
      console.log('  No invoices found');
    } else {
      invoicesSnapshot.forEach(doc => {
        const data = doc.data();
        const issueDate = data.issueDate?.toDate();
        const periodStart = data.billingPeriodStart?.toDate();
        const periodEnd = data.billingPeriodEnd?.toDate();
        console.log(`  - ${data.invoiceNumber}: Issued ${issueDate?.toISOString().split('T')[0]} | Period: ${periodStart?.toISOString().split('T')[0]} to ${periodEnd?.toISOString().split('T')[0]} - ¥${data.totalAmount}`);
      });
    }
    
    console.log('\n✅ Done!');
    
  } catch (error) {
    console.error('❌ Error checking data:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run the script
checkDataDates();


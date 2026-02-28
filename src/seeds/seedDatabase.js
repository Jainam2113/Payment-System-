require('dotenv').config();
const mongoose = require('mongoose');
const Role = require('../models/Role');
const User = require('../models/User');
const Payment = require('../models/Payment');
const { ROLES, ROLE_PERMISSIONS, PAYMENT_STATUS } = require('../utils/constants');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Clear existing data
const clearDatabase = async () => {
  try {
    await Role.deleteMany({});
    await User.deleteMany({});
    await Payment.deleteMany({});
    console.log('Cleared existing data');
  } catch (error) {
    console.error('Error clearing database:', error);
    throw error;
  }
};

// Seed roles
const seedRoles = async () => {
  try {
    const roles = [
      {
        name: ROLES.ADMIN,
        permissions: ROLE_PERMISSIONS[ROLES.ADMIN],
        description: 'Administrator with full system access'
      },
      {
        name: ROLES.MANAGER,
        permissions: ROLE_PERMISSIONS[ROLES.MANAGER],
        description: 'Manager with payment approval and processing capabilities'
      },
      {
        name: ROLES.USER,
        permissions: ROLE_PERMISSIONS[ROLES.USER],
        description: 'Regular user with basic payment creation capabilities'
      }
    ];

    const createdRoles = await Role.insertMany(roles);
    console.log(`Created ${createdRoles.length} roles`);
    return createdRoles;
  } catch (error) {
    console.error('Error seeding roles:', error);
    throw error;
  }
};

// Seed users
const seedUsers = async (roles) => {
  try {
    const adminRole = roles.find(r => r.name === ROLES.ADMIN);
    const managerRole = roles.find(r => r.name === ROLES.MANAGER);
    const userRole = roles.find(r => r.name === ROLES.USER);

    const users = [
      {
        email: 'admin@example.com',
        password: 'Admin@123',
        firstName: 'Admin',
        lastName: 'User',
        role: adminRole._id,
        isActive: true
      },
      {
        email: 'manager@example.com',
        password: 'Manager@123',
        firstName: 'Manager',
        lastName: 'User',
        role: managerRole._id,
        isActive: true
      },
      {
        email: 'user@example.com',
        password: 'User@123',
        firstName: 'Regular',
        lastName: 'User',
        role: userRole._id,
        isActive: true
      },
      {
        email: 'john.doe@example.com',
        password: 'User@123',
        firstName: 'John',
        lastName: 'Doe',
        role: userRole._id,
        isActive: true
      },
      {
        email: 'jane.smith@example.com',
        password: 'User@123',
        firstName: 'Jane',
        lastName: 'Smith',
        role: userRole._id,
        isActive: true
      }
    ];

    const createdUsers = await User.insertMany(users);
    console.log(`Created ${createdUsers.length} users`);
    return createdUsers;
  } catch (error) {
    console.error('Error seeding users:', error);
    throw error;
  }
};

// Seed payments
const seedPayments = async (users) => {
  try {
    const regularUser1 = users.find(u => u.email === 'user@example.com');
    const regularUser2 = users.find(u => u.email === 'john.doe@example.com');
    const regularUser3 = users.find(u => u.email === 'jane.smith@example.com');
    const manager = users.find(u => u.email === 'manager@example.com');
    const admin = users.find(u => u.email === 'admin@example.com');

    const payments = [
      // Pending payments
      {
        user: regularUser1._id,
        amount: 99.99,
        currency: 'USD',
        description: 'Monthly subscription payment',
        paymentMethod: 'card',
        status: PAYMENT_STATUS.PENDING
      },
      {
        user: regularUser2._id,
        amount: 249.50,
        currency: 'USD',
        description: 'Product purchase',
        paymentMethod: 'card',
        status: PAYMENT_STATUS.PENDING
      },
      {
        user: regularUser3._id,
        amount: 1500.00,
        currency: 'USD',
        description: 'Service payment',
        paymentMethod: 'bank_transfer',
        status: PAYMENT_STATUS.PENDING
      },

      // Approved payment (ready to be processed)
      {
        user: regularUser1._id,
        amount: 149.99,
        currency: 'USD',
        description: 'Premium plan upgrade',
        paymentMethod: 'card',
        status: PAYMENT_STATUS.APPROVED,
        approvedBy: manager._id,
        approvedAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },

      // Rejected payment
      {
        user: regularUser2._id,
        amount: 5000.00,
        currency: 'USD',
        description: 'Large transaction',
        paymentMethod: 'bank_transfer',
        status: PAYMENT_STATUS.REJECTED,
        approvedBy: admin._id,
        approvedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        failureReason: 'Transaction amount exceeds approved limit'
      },

      // Completed payment
      {
        user: regularUser3._id,
        amount: 79.99,
        currency: 'USD',
        description: 'Annual membership',
        paymentMethod: 'card',
        status: PAYMENT_STATUS.COMPLETED,
        approvedBy: manager._id,
        approvedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        processedBy: admin._id,
        processedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000), // 10 mins after approval
        completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 12 * 60 * 1000) // 12 mins after approval
      },

      // Failed payment
      {
        user: regularUser1._id,
        amount: 299.99,
        currency: 'USD',
        description: 'Software license',
        paymentMethod: 'card',
        status: PAYMENT_STATUS.FAILED,
        approvedBy: manager._id,
        approvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        processedBy: admin._id,
        processedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000), // 5 mins after approval
        failureReason: 'Payment gateway error: Card declined'
      }
    ];

    const createdPayments = await Payment.insertMany(payments);
    console.log(`Created ${createdPayments.length} sample payments`);
    return createdPayments;
  } catch (error) {
    console.error('Error seeding payments:', error);
    throw error;
  }
};

// Display seed summary
const displaySummary = (roles, users, payments) => {
  console.log('\n' + '='.repeat(60));
  console.log('DATABASE SEEDING COMPLETED SUCCESSFULLY');
  console.log('='.repeat(60));
  console.log('\nTest Accounts:');
  console.log('─'.repeat(60));
  console.log('Admin Account:');
  console.log('  Email: admin@example.com');
  console.log('  Password: Admin@123');
  console.log('  Permissions: All (full access)');
  console.log('\nManager Account:');
  console.log('  Email: manager@example.com');
  console.log('  Password: Manager@123');
  console.log('  Permissions: Payment approval, processing, user read');
  console.log('\nUser Account:');
  console.log('  Email: user@example.com');
  console.log('  Password: User@123');
  console.log('  Permissions: Create and read own payments');
  console.log('\nAdditional Users:');
  console.log('  Email: john.doe@example.com (Password: User@123)');
  console.log('  Email: jane.smith@example.com (Password: User@123)');
  console.log('─'.repeat(60));
  console.log(`\nSummary:`);
  console.log(`  Roles: ${roles.length}`);
  console.log(`  Users: ${users.length}`);
  console.log(`  Sample Payments: ${payments.length}`);
  console.log('='.repeat(60));
  console.log('\nYou can now start the server with: npm run dev');
  console.log('='.repeat(60) + '\n');
};

// Main seed function
const seedDatabase = async () => {
  try {
    await connectDB();

    // Check if --clean flag is provided
    const shouldClean = process.argv.includes('--clean');

    if (shouldClean) {
      console.log('Cleaning database...');
      await clearDatabase();
    } else {
      // Check if data already exists
      const existingRoles = await Role.countDocuments();
      if (existingRoles > 0) {
        console.log('\nDatabase already contains data!');
        console.log('Use "npm run seed:clean" to clear and reseed the database.\n');
        process.exit(0);
      }
    }

    console.log('Starting database seeding...\n');

    const roles = await seedRoles();
    const users = await seedUsers(roles);
    const payments = await seedPayments(users);

    displaySummary(roles, users, payments);

    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run seeding
seedDatabase();

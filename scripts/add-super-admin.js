const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DATABASE_NAME = process.env.MONGODB_DB || 'prantek';

console.log('Using MongoDB URI:', MONGODB_URI.substring(0, 30) + '...');
console.log('Using Database:', DATABASE_NAME);

async function addSuperAdmin() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');
    
    const db = client.db(DATABASE_NAME);
    const usersCollection = db.collection('users');
    
    // Check if super admin already exists
    const existingUser = await usersCollection.findOne({ 
      email: 'superadmin@prantek.com' 
    });
    
    if (existingUser) {
      console.log('\n⚠️  Super admin user already exists. Updating password...');
      
      // Hash the new password
      const hashedPassword = await bcrypt.hash('SuperAdmin@2025', 10);
      
      // Update the existing user
      const result = await usersCollection.updateOne(
        { email: 'superadmin@prantek.com' },
        {
          $set: {
            password: hashedPassword,
            name: 'Prakash Reddy',
            role: 'super-admin',
            isActive: true,
            updatedAt: new Date()
          }
        }
      );
      
      if (result.modifiedCount > 0) {
        console.log('✅ Super admin password updated successfully!');
      } else {
        console.log('ℹ️  No changes made to super admin user');
      }
    } else {
      console.log('\n➕ Creating new super admin user...');
      
      // Hash the password
      const hashedPassword = await bcrypt.hash('SuperAdmin@2025', 10);
      
      // Create new super admin user
      const superAdmin = {
        email: 'superadmin@prantek.com',
        password: hashedPassword,
        name: 'Prakash Reddy',
        role: 'super-admin',
        userType: 'admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await usersCollection.insertOne(superAdmin);
      
      if (result.insertedId) {
        console.log('✅ Super admin user created successfully!');
        console.log('Inserted ID:', result.insertedId);
      }
    }
    
    // Verify the user
    const verifyUser = await usersCollection.findOne({ 
      email: 'superadmin@prantek.com' 
    });
    
    console.log('\n📋 Super Admin Details:');
    console.log('Email:', verifyUser.email);
    console.log('Name:', verifyUser.name);
    console.log('Role:', verifyUser.role);
    console.log('Is Active:', verifyUser.isActive);
    console.log('Created At:', verifyUser.createdAt);
    
    console.log('\n🔐 Login Credentials:');
    console.log('Email: superadmin@prantek.com');
    console.log('Password: SuperAdmin@2025');
    
  } catch (error) {
    console.error('❌ Error adding super admin:', error);
  } finally {
    await client.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

addSuperAdmin();

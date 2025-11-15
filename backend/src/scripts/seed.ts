import sequelize from '../config/database';
import User from '../models/User';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const seedDatabase = async () => {
  try {
    console.log('Starting database seed...');

    // Connect to database
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Sync models (create tables if they don't exist)
    await sequelize.sync();
    console.log('Database models synchronized.');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({
      where: { email: 'admin@medialab.com' }
    });

    if (existingAdmin) {
      console.log('Admin user already exists. Skipping seed.');
      return;
    }

    // Create admin user
    await User.create({
      email: 'admin@medialab.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      isActive: true
    });

    console.log('✅ Admin user created successfully!');
    console.log('   Email: admin@medialab.com');
    console.log('   Password: admin123');
    console.log('   ⚠️  IMPORTANT: Change this password in production!');

  } catch (error) {
    console.error('❌ Seed error:', error);
    throw error;
  } finally {
    await sequelize.close();
    console.log('Database connection closed.');
  }
};

// Run the seed
seedDatabase()
  .then(() => {
    console.log('Seed completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });

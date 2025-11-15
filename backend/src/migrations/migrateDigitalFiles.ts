import DigitalItem from '../models/DigitalItem';
import DigitalFile from '../models/DigitalFile';
import sequelize from '../config/database';

/**
 * Migrate existing file data from DigitalItem to DigitalFile table
 * This script moves fileSize, filePath, and format fields to the new DigitalFile model
 */
export const migrateDigitalFiles = async (): Promise<void> => {
  console.log('Starting migration of digital files...');

  try {
    // Start a transaction
    await sequelize.transaction(async (transaction) => {
      // Get all digital items that have file data
      const digitalItems = await DigitalItem.findAll({
        where: {
          filePath: {
            [sequelize.Sequelize.Op.ne]: null,
          },
        },
        transaction,
      });

      console.log(`Found ${digitalItems.length} digital items with file data to migrate`);

      let migrated = 0;
      let skipped = 0;

      for (const item of digitalItems) {
        // Check if this item already has files migrated
        const existingFiles = await DigitalFile.count({
          where: { digitalItemId: item.id },
          transaction,
        });

        if (existingFiles > 0) {
          console.log(`Item ${item.id} already has ${existingFiles} file(s), skipping...`);
          skipped++;
          continue;
        }

        // Create a new DigitalFile entry
        await DigitalFile.create(
          {
            digitalItemId: item.id,
            format: item.format || 'other',
            filePath: item.filePath!,
            fileSize: item.fileSize,
            isPrimary: true, // The existing file is the primary one
            version: '1.0',
          },
          { transaction }
        );

        migrated++;
      }

      console.log(`Migration complete: ${migrated} files migrated, ${skipped} items skipped`);
    });
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  }
};

// Run migration if this file is executed directly
if (require.main === module) {
  migrateDigitalFiles()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

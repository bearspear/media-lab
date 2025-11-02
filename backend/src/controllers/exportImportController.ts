import { Request, Response } from 'express';
import DigitalItem from '../models/DigitalItem';
import PhysicalItem from '../models/PhysicalItem';
import Author from '../models/Author';
import Publisher from '../models/Publisher';
import Genre from '../models/Genre';
import Collection from '../models/Collection';
import Tag from '../models/Tag';
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { coverImageService } from '../services/coverImageService';

// Export all library data as JSON
export const exportJSON = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userId = req.user.id;

    // Fetch all data for the user
    const [digitalItems, physicalItems, collections, tags] = await Promise.all([
      DigitalItem.findAll({
        where: { userId },
        include: [
          { model: Author, as: 'authors', through: { attributes: [] } },
          { model: Publisher, as: 'publisherInfo' },
          { model: Genre, as: 'genres', through: { attributes: [] } },
          { model: Tag, as: 'tags', through: { attributes: [] } },
          { model: Collection, as: 'collections', through: { attributes: [] } }
        ]
      }),
      PhysicalItem.findAll({
        where: { userId },
        include: [
          { model: Author, as: 'authors', through: { attributes: [] } },
          { model: Publisher, as: 'publisherInfo' },
          { model: Genre, as: 'genres', through: { attributes: [] } },
          { model: Tag, as: 'tags', through: { attributes: [] } },
          { model: Collection, as: 'collections', through: { attributes: [] } }
        ]
      }),
      Collection.findAll({ where: { userId } }),
      Tag.findAll({ where: { userId } })
    ]);

    const exportData = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      digitalItems: digitalItems.map(item => item.toJSON()),
      physicalItems: physicalItems.map(item => item.toJSON()),
      collections: collections.map(c => c.toJSON()),
      tags: tags.map(t => t.toJSON())
    };

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="library-export-${Date.now()}.json"`);
    res.json(exportData);
  } catch (error) {
    console.error('Export JSON error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
};

// Export all library data as CSV
export const exportCSV = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userId = req.user.id;

    // Fetch all items
    const [digitalItems, physicalItems] = await Promise.all([
      DigitalItem.findAll({
        where: { userId },
        include: [
          { model: Author, as: 'authors', through: { attributes: [] } },
          { model: Publisher, as: 'publisherInfo' },
          { model: Genre, as: 'genres', through: { attributes: [] } }
        ]
      }),
      PhysicalItem.findAll({
        where: { userId },
        include: [
          { model: Author, as: 'authors', through: { attributes: [] } },
          { model: Publisher, as: 'publisherInfo' },
          { model: Genre, as: 'genres', through: { attributes: [] } }
        ]
      })
    ]);

    // CSV headers
    const headers = [
      'Item Type',
      'Title',
      'Subtitle',
      'Authors',
      'Publisher',
      'Publication Date',
      'Genres',
      'ISBN',
      'Description',
      'Rating',
      'Reading Status',
      'Format/Condition',
      'File Path/Location',
      'Cover Image'
    ];

    // Convert items to CSV rows
    const rows = [
      headers.join(','),
      ...digitalItems.map(item => {
        const json = item.toJSON() as any;
        return [
          'digital',
          `"${escapeCsv(json.title || '')}"`,
          `"${escapeCsv(json.subtitle || '')}"`,
          `"${json.authors?.map((a: any) => a.name).join('; ') || ''}"`,
          `"${json.publisherInfo?.name || ''}"`,
          json.publicationDate || '',
          `"${json.genres?.map((g: any) => g.name).join('; ') || ''}"`,
          json.isbn || '',
          `"${escapeCsv(json.description || '')}"`,
          json.rating || '',
          json.readingStatus || '',
          json.format || '',
          json.filePath || '',
          json.coverImage || ''
        ].join(',');
      }),
      ...physicalItems.map(item => {
        const json = item.toJSON() as any;
        return [
          'physical',
          `"${escapeCsv(json.title || '')}"`,
          `"${escapeCsv(json.subtitle || '')}"`,
          `"${json.authors?.map((a: any) => a.name).join('; ') || ''}"`,
          `"${json.publisherInfo?.name || ''}"`,
          json.publicationDate || '',
          `"${json.genres?.map((g: any) => g.name).join('; ') || ''}"`,
          json.isbn || '',
          `"${escapeCsv(json.description || '')}"`,
          json.rating || '',
          json.readingStatus || '',
          json.condition || '',
          json.location || '',
          json.coverImage || ''
        ].join(',');
      })
    ];

    const csvContent = rows.join('\n');

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="library-export-${Date.now()}.csv"`);
    res.send(csvContent);
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
};

// Helper function to escape CSV values
function escapeCsv(value: string): string {
  if (!value) return '';
  return value.replace(/"/g, '""');
}

// Import library data from JSON
export const importJSON = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userId = req.user.id;
    const importData = req.body;

    // Validate import data structure
    if (!importData || !importData.version) {
      res.status(400).json({ error: 'Invalid import data format' });
      return;
    }

    let importedCounts = {
      digitalItems: 0,
      physicalItems: 0,
      collections: 0,
      tags: 0
    };

    // Import collections first (they may be referenced by items)
    if (importData.collections && Array.isArray(importData.collections)) {
      for (const collectionData of importData.collections) {
        await Collection.findOrCreate({
          where: { name: collectionData.name, userId },
          defaults: {
            ...collectionData,
            userId,
            id: undefined // Let the database assign new IDs
          }
        });
        importedCounts.collections++;
      }
    }

    // Import tags
    if (importData.tags && Array.isArray(importData.tags)) {
      for (const tagData of importData.tags) {
        await Tag.findOrCreate({
          where: { name: tagData.name, userId },
          defaults: {
            ...tagData,
            userId,
            id: undefined
          }
        });
        importedCounts.tags++;
      }
    }

    // Import digital items
    if (importData.digitalItems && Array.isArray(importData.digitalItems)) {
      for (const itemData of importData.digitalItems) {
        const authors = itemData.authors || [];
        const genres = itemData.genres || [];
        const publisherInfo = itemData.publisherInfo;

        // Find or create publisher
        let publisherId = null;
        if (publisherInfo && publisherInfo.name) {
          const [publisher] = await Publisher.findOrCreate({
            where: { name: publisherInfo.name },
            defaults: publisherInfo
          });
          publisherId = publisher.id;
        }

        // Create the item
        const newItem = await DigitalItem.create({
          ...itemData,
          userId,
          publisher: publisherId,
          id: undefined,
          createdAt: undefined,
          updatedAt: undefined
        });

        // Associate authors
        for (const authorData of authors) {
          const [author] = await Author.findOrCreate({
            where: { name: authorData.name },
            defaults: authorData
          });
          await newItem.$add('author', author);
        }

        // Associate genres
        for (const genreData of genres) {
          const [genre] = await Genre.findOrCreate({
            where: { name: genreData.name },
            defaults: genreData
          });
          await newItem.$add('genre', genre);
        }

        importedCounts.digitalItems++;
      }
    }

    // Import physical items
    if (importData.physicalItems && Array.isArray(importData.physicalItems)) {
      for (const itemData of importData.physicalItems) {
        const authors = itemData.authors || [];
        const genres = itemData.genres || [];
        const publisherInfo = itemData.publisherInfo;

        // Find or create publisher
        let publisherId = null;
        if (publisherInfo && publisherInfo.name) {
          const [publisher] = await Publisher.findOrCreate({
            where: { name: publisherInfo.name },
            defaults: publisherInfo
          });
          publisherId = publisher.id;
        }

        // Create the item
        const newItem = await PhysicalItem.create({
          ...itemData,
          userId,
          publisher: publisherId,
          id: undefined,
          createdAt: undefined,
          updatedAt: undefined
        });

        // Associate authors
        for (const authorData of authors) {
          const [author] = await Author.findOrCreate({
            where: { name: authorData.name },
            defaults: authorData
          });
          await newItem.$add('author', author);
        }

        // Associate genres
        for (const genreData of genres) {
          const [genre] = await Genre.findOrCreate({
            where: { name: genreData.name },
            defaults: genreData
          });
          await newItem.$add('genre', genre);
        }

        importedCounts.physicalItems++;
      }
    }

    res.json({
      success: true,
      message: 'Import completed successfully',
      imported: importedCounts
    });
  } catch (error) {
    console.error('Import JSON error:', error);
    res.status(500).json({ error: 'Failed to import data', details: (error as Error).message });
  }
};

// Import library data from Libib CSV export
export const importLibibCSV = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'No CSV file provided' });
      return;
    }

    const userId = req.user.id;
    const csvFilePath = req.file.path;

    // Read and parse CSV file
    const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    if (records.length === 0) {
      res.status(400).json({ error: 'CSV file is empty or invalid' });
      return;
    }

    // Detect CSV format based on column headers
    const firstRow = records[0];
    const isLibibFormat = 'Type' in firstRow && 'Authors' in firstRow;
    const isLibraryThingFormat = 'item_type' in firstRow && 'creators' in firstRow && 'ean_isbn13' in firstRow;

    let importedCounts = {
      physicalItems: 0,
      digitalItems: 0,
      skipped: 0,
      errors: [] as string[]
    };

    // Process each row
    for (const row of records) {
      try {
        let isDigital = false;
        let authorNames: string[] = [];
        let isbn = '';
        let lccn = '';
        let title = '';
        let publisher = '';
        let publicationDate: string | null = null;
        let description = '';
        let pageCount: number | null = null;

        if (isLibibFormat) {
          // Libib format
          isDigital = row.Type?.toLowerCase().includes('ebook') ||
                     row.Type?.toLowerCase().includes('digital') ||
                     row.Format?.toLowerCase().includes('ebook') ||
                     row.Format?.toLowerCase().includes('digital');

          authorNames = row.Authors ? row.Authors.split(';').map((a: string) => a.trim()).filter((a: string) => a) : [];
          isbn = row.ISBN || row.ISBN13 || row.ISBN10 || '';
          lccn = row.LCCN || '';
          title = row.Title || 'Untitled';
          publisher = row.Publisher || '';

          const publicationYear = row['Year Published'] || row.Year || row.PublicationDate;
          publicationDate = publicationYear ? `${publicationYear}-01-01` : null;
          description = row.Description || row.Notes || '';
        } else if (isLibraryThingFormat) {
          // LibraryThing/CLZ format
          isDigital = row.item_type?.toLowerCase().includes('ebook') ||
                     row.item_type?.toLowerCase().includes('digital');

          // Parse authors from creators field or construct from first_name/last_name
          if (row.creators) {
            authorNames = row.creators.split(',').map((a: string) => a.trim()).filter((a: string) => a);
          } else if (row.first_name || row.last_name) {
            const authorName = `${row.first_name || ''} ${row.last_name || ''}`.trim();
            if (authorName) {
              authorNames = [authorName];
            }
          }

          isbn = row.ean_isbn13 || row.upc_isbn10 || '';
          lccn = row.lccn || row.LCCN || '';
          title = row.title || 'Untitled';
          publisher = row.publisher || '';
          publicationDate = row.publish_date || null;
          description = row.description || row.notes || '';

          if (row.length) {
            const parsedLength = parseInt(row.length);
            if (!isNaN(parsedLength)) {
              pageCount = parsedLength;
            }
          }
        } else {
          // Unknown format, skip this row
          console.warn('Unknown CSV format, skipping row');
          importedCounts.skipped++;
          continue;
        }

        // Now use the normalized data

        // Parse genres/categories
        const genreNames = row.Tags || row.tags ?
          (row.Tags || row.tags).split(',').map((g: string) => g.trim()).filter((g: string) => g) : [];

        // Find or create publisher
        let publisherId = null;
        if (publisher) {
          const [publisherRecord] = await Publisher.findOrCreate({
            where: { name: publisher.trim() },
            defaults: { name: publisher.trim() }
          });
          publisherId = publisherRecord.id;
        }

        // Parse rating (keep within 0-5 range)
        let rating = null;
        if (row.Rating || row.rating) {
          const parsedRating = parseFloat(row.Rating || row.rating);
          if (!isNaN(parsedRating) && parsedRating >= 0 && parsedRating <= 5) {
            rating = parsedRating;
          }
        }

        // Map reading status from Libib format to our enum
        const mapReadingStatus = (status: string): string | null => {
          if (!status) return null;
          const statusLower = status.toLowerCase().trim();
          const statusMap: { [key: string]: string } = {
            'read': 'completed',
            'completed': 'completed',
            'reading': 'reading',
            'currently reading': 'reading',
            'to read': 'to_read',
            'want to read': 'to_read',
            'on hold': 'on_hold',
            'paused': 'on_hold',
            'dropped': 'dropped',
            'dnf': 'dropped'
          };
          return statusMap[statusLower] || null;
        };

        // Map condition from Libib format to our enum
        const mapCondition = (condition: string): string | null => {
          if (!condition) return null;
          const conditionLower = condition.toLowerCase().trim();
          const conditionMap: { [key: string]: string } = {
            'new': 'new',
            'like new': 'like_new',
            'like-new': 'like_new',
            'very good': 'very_good',
            'very-good': 'very_good',
            'excellent': 'like_new',
            'good': 'good',
            'acceptable': 'acceptable',
            'fair': 'acceptable',
            'poor': 'poor'
          };
          return conditionMap[conditionLower] || null;
        }

        // Common item data
        const itemData: any = {
          userId,
          title: title,
          subtitle: row.Subtitle || null,
          isbn: isbn || null,
          lccn: lccn || null,
          publisher: publisherId,
          publicationDate: publicationDate,
          description: description || null,
          pages: pageCount,
          rating: rating,
          readingStatus: mapReadingStatus(row.Status || row.status),
        };

        // Fetch cover image - try ISBN first, then fall back to LCCN
        let coverPath = null;
        if (isbn) {
          try {
            coverPath = await coverImageService.fetchCoverByISBN(isbn);
            if (coverPath) {
              console.log(`Cover image downloaded for ISBN ${isbn}: ${coverPath}`);
            }
          } catch (coverError) {
            console.error(`Failed to fetch cover for ISBN ${isbn}:`, coverError);
          }
        }

        // If no cover from ISBN, try LCCN
        if (!coverPath && lccn) {
          try {
            coverPath = await coverImageService.fetchCoverByLCCN(lccn);
            if (coverPath) {
              console.log(`Cover image downloaded for LCCN ${lccn}: ${coverPath}`);
            }
          } catch (coverError) {
            console.error(`Failed to fetch cover for LCCN ${lccn}:`, coverError);
          }
        }

        if (coverPath) {
          itemData.coverImage = coverPath;
        }

        // Map format to valid enum value
        const mapFormat = (format: string): string | undefined => {
          if (!format) return undefined;
          const formatLower = format.toLowerCase().trim();
          const formatMap: { [key: string]: string } = {
            'epub': 'epub',
            'pdf': 'pdf',
            'mobi': 'mobi',
            'azw3': 'azw3',
            'azw': 'azw3',
            'mp3': 'mp3',
            'm4a': 'm4a',
            'm4b': 'm4a',
            'mp4': 'mp4',
            'mkv': 'mkv',
            'avi': 'other',
            'ebook': 'epub', // Default ebook to epub
            'audiobook': 'mp3',
            'video': 'mp4'
          };
          return formatMap[formatLower] || 'other';
        };

        // Create the item (physical or digital)
        let newItem;
        if (isDigital) {
          newItem = await DigitalItem.create({
            ...itemData,
            type: 'ebook', // Default to ebook for digital items from Libib
            format: mapFormat(row.Format),
            filePath: row.Location || null,
          });
          importedCounts.digitalItems++;
        } else {
          newItem = await PhysicalItem.create({
            ...itemData,
            type: 'book', // Default to book for physical items from Libib
            condition: mapCondition(row.Condition),
            location: row.Location || null,
          });
          importedCounts.physicalItems++;
        }

        // Associate authors
        for (const authorName of authorNames) {
          if (authorName) {
            const [author] = await Author.findOrCreate({
              where: { name: authorName },
              defaults: { name: authorName }
            });
            // Use the magic method generated by Sequelize
            await (newItem as any).addAuthor(author);
          }
        }

        // Associate genres
        for (const genreName of genreNames) {
          if (genreName) {
            const [genre] = await Genre.findOrCreate({
              where: { name: genreName },
              defaults: { name: genreName }
            });
            // Use the magic method generated by Sequelize
            await (newItem as any).addGenre(genre);
          }
        }

      } catch (rowError) {
        console.error('Error importing row:', rowError);
        importedCounts.errors.push(`Row "${row.Title || 'unknown'}": ${(rowError as Error).message}`);
        importedCounts.skipped++;
      }
    }

    // Delete the temporary CSV file
    fs.unlinkSync(csvFilePath);

    res.json({
      success: true,
      message: 'Libib CSV import completed',
      imported: importedCounts
    });
  } catch (error) {
    console.error('Import Libib CSV error:', error);

    // Clean up the uploaded file in case of error
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting temp file:', unlinkError);
      }
    }

    res.status(500).json({
      error: 'Failed to import Libib CSV',
      details: (error as Error).message
    });
  }
};

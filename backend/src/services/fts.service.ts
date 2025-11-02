import { sequelize } from '../config/database';

/**
 * Full-Text Search (FTS5) Service
 * Manages SQLite FTS5 virtual tables for full-text search
 */
export class FTSService {
  /**
   * Initialize FTS5 virtual tables and triggers
   */
  static async initialize(): Promise<void> {
    try {
      // Create FTS5 virtual table for digital items
      await sequelize.query(`
        CREATE VIRTUAL TABLE IF NOT EXISTS digital_items_fts USING fts5(
          id UNINDEXED,
          title,
          description,
          publisher,
          isbn,
          tags,
          content='digital_items',
          content_rowid='id',
          tokenize='porter unicode61'
        );
      `);

      // Create FTS5 virtual table for physical items
      await sequelize.query(`
        CREATE VIRTUAL TABLE IF NOT EXISTS physical_items_fts USING fts5(
          id UNINDEXED,
          title,
          description,
          publisher,
          isbn,
          location,
          tags,
          content='physical_items',
          content_rowid='id',
          tokenize='porter unicode61'
        );
      `);

      console.log('FTS5 virtual tables created successfully.');

      // Create triggers to keep FTS tables in sync
      await this.createTriggers();

      // Populate FTS tables with existing data
      await this.rebuildIndex();

    } catch (error) {
      console.error('Error initializing FTS5:', error);
      throw error;
    }
  }

  /**
   * Create triggers to keep FTS tables synchronized
   */
  private static async createTriggers(): Promise<void> {
    // Digital Items Triggers
    await sequelize.query(`
      CREATE TRIGGER IF NOT EXISTS digital_items_ai AFTER INSERT ON digital_items BEGIN
        INSERT INTO digital_items_fts(
          id, title, description, publisher, isbn, tags
        ) VALUES (
          new.id,
          new.title,
          new.description,
          new.publisher,
          new.isbn,
          CASE WHEN new.tags IS NOT NULL THEN json_extract(new.tags, '$') ELSE '' END
        );
      END;
    `);

    await sequelize.query(`
      CREATE TRIGGER IF NOT EXISTS digital_items_ad AFTER DELETE ON digital_items BEGIN
        INSERT INTO digital_items_fts(digital_items_fts, id, title, description, publisher, isbn, tags)
        VALUES('delete', old.id, old.title, old.description, old.publisher, old.isbn,
          CASE WHEN old.tags IS NOT NULL THEN json_extract(old.tags, '$') ELSE '' END);
      END;
    `);

    await sequelize.query(`
      CREATE TRIGGER IF NOT EXISTS digital_items_au AFTER UPDATE ON digital_items BEGIN
        INSERT INTO digital_items_fts(digital_items_fts, id, title, description, publisher, isbn, tags)
        VALUES('delete', old.id, old.title, old.description, old.publisher, old.isbn,
          CASE WHEN old.tags IS NOT NULL THEN json_extract(old.tags, '$') ELSE '' END);
        INSERT INTO digital_items_fts(
          id, title, description, publisher, isbn, tags
        ) VALUES (
          new.id,
          new.title,
          new.description,
          new.publisher,
          new.isbn,
          CASE WHEN new.tags IS NOT NULL THEN json_extract(new.tags, '$') ELSE '' END
        );
      END;
    `);

    // Physical Items Triggers
    await sequelize.query(`
      CREATE TRIGGER IF NOT EXISTS physical_items_ai AFTER INSERT ON physical_items BEGIN
        INSERT INTO physical_items_fts(
          id, title, description, publisher, isbn, location, tags
        ) VALUES (
          new.id,
          new.title,
          new.description,
          new.publisher,
          new.isbn,
          new.location,
          CASE WHEN new.tags IS NOT NULL THEN json_extract(new.tags, '$') ELSE '' END
        );
      END;
    `);

    await sequelize.query(`
      CREATE TRIGGER IF NOT EXISTS physical_items_ad AFTER DELETE ON physical_items BEGIN
        INSERT INTO physical_items_fts(physical_items_fts, id, title, description, publisher, isbn, location, tags)
        VALUES('delete', old.id, old.title, old.description, old.publisher, old.isbn, old.location,
          CASE WHEN old.tags IS NOT NULL THEN json_extract(old.tags, '$') ELSE '' END);
      END;
    `);

    await sequelize.query(`
      CREATE TRIGGER IF NOT EXISTS physical_items_au AFTER UPDATE ON physical_items BEGIN
        INSERT INTO physical_items_fts(physical_items_fts, id, title, description, publisher, isbn, location, tags)
        VALUES('delete', old.id, old.title, old.description, old.publisher, old.isbn, old.location,
          CASE WHEN old.tags IS NOT NULL THEN json_extract(old.tags, '$') ELSE '' END);
        INSERT INTO physical_items_fts(
          id, title, description, publisher, isbn, location, tags
        ) VALUES (
          new.id,
          new.title,
          new.description,
          new.publisher,
          new.isbn,
          new.location,
          CASE WHEN new.tags IS NOT NULL THEN json_extract(new.tags, '$') ELSE '' END
        );
      END;
    `);

    console.log('FTS5 triggers created successfully.');
  }

  /**
   * Rebuild FTS index from existing data
   */
  static async rebuildIndex(): Promise<void> {
    try {
      // Rebuild digital items index
      await sequelize.query(`
        INSERT INTO digital_items_fts(digital_items_fts) VALUES('rebuild');
      `);

      // Rebuild physical items index
      await sequelize.query(`
        INSERT INTO physical_items_fts(physical_items_fts) VALUES('rebuild');
      `);

      console.log('FTS5 indexes rebuilt successfully.');
    } catch (error) {
      // If rebuild fails, it's likely because tables are empty
      console.log('FTS5 indexes rebuild skipped (tables may be empty).');
    }
  }

  /**
   * Search digital items
   */
  static async searchDigitalItems(
    query: string,
    userId: number,
    options: {
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ items: any[], total: number }> {
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    const searchQuery = this.sanitizeSearchQuery(query);

    // Search with FTS5
    const [items] = await sequelize.query(`
      SELECT
        di.*,
        rank
      FROM digital_items di
      INNER JOIN (
        SELECT id, rank
        FROM digital_items_fts
        WHERE digital_items_fts MATCH :searchQuery
        ORDER BY rank
      ) fts ON di.id = fts.id
      WHERE di.user_id = :userId
      ORDER BY fts.rank
      LIMIT :limit OFFSET :offset
    `, {
      replacements: { searchQuery, userId, limit, offset },
    });

    const [countResult] = await sequelize.query(`
      SELECT COUNT(*) as total
      FROM digital_items di
      INNER JOIN digital_items_fts fts ON di.id = fts.id
      WHERE fts.digital_items_fts MATCH :searchQuery
        AND di.user_id = :userId
    `, {
      replacements: { searchQuery, userId },
    });

    const total = (countResult[0] as any).total;

    return { items, total };
  }

  /**
   * Search physical items
   */
  static async searchPhysicalItems(
    query: string,
    userId: number,
    options: {
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ items: any[], total: number }> {
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    const searchQuery = this.sanitizeSearchQuery(query);

    // Search with FTS5
    const [items] = await sequelize.query(`
      SELECT
        pi.*,
        rank
      FROM physical_items pi
      INNER JOIN (
        SELECT id, rank
        FROM physical_items_fts
        WHERE physical_items_fts MATCH :searchQuery
        ORDER BY rank
      ) fts ON pi.id = fts.id
      WHERE pi.user_id = :userId
      ORDER BY fts.rank
      LIMIT :limit OFFSET :offset
    `, {
      replacements: { searchQuery, userId, limit, offset },
    });

    const [countResult] = await sequelize.query(`
      SELECT COUNT(*) as total
      FROM physical_items pi
      INNER JOIN physical_items_fts fts ON pi.id = fts.id
      WHERE fts.physical_items_fts MATCH :searchQuery
        AND pi.user_id = :userId
    `, {
      replacements: { searchQuery, userId },
    });

    const total = (countResult[0] as any).total;

    return { items, total };
  }

  /**
   * Search all items (both digital and physical)
   */
  static async searchAllItems(
    query: string,
    userId: number,
    options: {
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ items: any[], total: number }> {
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    const digitalResult = await this.searchDigitalItems(query, userId, { limit: 1000 });
    const physicalResult = await this.searchPhysicalItems(query, userId, { limit: 1000 });

    // Combine and sort by rank
    const allItems = [
      ...digitalResult.items.map((item: any) => ({ ...item, itemType: 'digital' })),
      ...physicalResult.items.map((item: any) => ({ ...item, itemType: 'physical' }))
    ].sort((a: any, b: any) => a.rank - b.rank);

    const total = digitalResult.total + physicalResult.total;
    const paginatedItems = allItems.slice(offset, offset + limit);

    return { items: paginatedItems, total };
  }

  /**
   * Sanitize search query for FTS5
   */
  private static sanitizeSearchQuery(query: string): string {
    // Remove special characters that could break FTS5 syntax
    // Keep only alphanumeric, spaces, and basic punctuation
    let sanitized = query.replace(/[^\w\s\-'"]/g, ' ').trim();

    // If query is empty after sanitization, return wildcard
    if (!sanitized) {
      return '*';
    }

    // Split into words and add * for prefix matching
    const words = sanitized.split(/\s+/).filter(w => w.length > 0);
    return words.map(w => `${w}*`).join(' ');
  }
}

export enum DigitalItemType {
  EBOOK = 'ebook',
  AUDIOBOOK = 'audiobook',
  PDF = 'pdf',
  VIDEO = 'video',
  MUSIC = 'music',
  OTHER = 'other',
}

export enum DigitalItemFormat {
  EPUB = 'epub',
  PDF = 'pdf',
  MOBI = 'mobi',
  AZW3 = 'azw3',
  MP3 = 'mp3',
  M4A = 'm4a',
  MP4 = 'mp4',
  MKV = 'mkv',
  OTHER = 'other',
}

export enum ReadingStatus {
  TO_READ = 'to_read',
  READING = 'reading',
  COMPLETED = 'completed',
  ON_HOLD = 'on_hold',
  DROPPED = 'dropped',
}

export interface Author {
  id: number;
  name: string;
}

export interface Publisher {
  id: number;
  name: string;
}

export interface Genre {
  id: number;
  name: string;
}

export interface DigitalItem {
  id: number;
  title: string;
  type: DigitalItemType;
  format?: DigitalItemFormat;
  description?: string;
  isbn?: string;
  lccn?: string;
  publisher?: string; // Legacy field
  publisherId?: number;
  publisherInfo?: Publisher;
  publishedYear?: number;
  language?: string;
  fileSize?: number;
  filePath?: string;
  coverImage?: string;
  rating?: number;
  tags?: string[];
  readingStatus?: ReadingStatus;
  isFavorite: boolean;
  notes?: string;
  review?: string;
  userId: number;
  authors?: Author[];
  genres?: Genre[];
  authorIds?: number[]; // For form handling
  genreIds?: number[]; // For form handling
  createdAt: Date;
  updatedAt: Date;
}

export enum PhysicalItemType {
  BOOK = 'book',
  DVD = 'dvd',
  BLURAY = 'bluray',
  CD = 'cd',
  VINYL = 'vinyl',
  MAGAZINE = 'magazine',
  COMIC = 'comic',
  OTHER = 'other',
}

export enum PhysicalItemCondition {
  NEW = 'new',
  LIKE_NEW = 'like_new',
  VERY_GOOD = 'very_good',
  GOOD = 'good',
  ACCEPTABLE = 'acceptable',
  POOR = 'poor',
}

export interface PhysicalItem {
  id: number;
  title: string;
  type: PhysicalItemType;
  condition?: PhysicalItemCondition;
  description?: string;
  isbn?: string;
  lccn?: string;
  barcode?: string;
  publisher?: string; // Legacy field
  publisherId?: number;
  publisherInfo?: Publisher;
  publishedYear?: number;
  language?: string;
  location?: string;
  coverImage?: string;
  rating?: number;
  tags?: string[];
  readingStatus?: ReadingStatus;
  isFavorite: boolean;
  notes?: string;
  review?: string;
  quantity?: number;
  userId: number;
  authors?: Author[];
  genres?: Genre[];
  authorIds?: number[]; // For form handling
  genreIds?: number[]; // For form handling
  createdAt: Date;
  updatedAt: Date;
}

export interface ReadingProgress {
  id: number;
  userId: number;
  digitalItemId: number;
  digitalFileId?: number;
  location: string; // Page number, CFI, timestamp, etc.
  percentage: number; // 0-100
  lastReadAt: Date;
  createdAt?: Date;
  updatedAt?: Date;

  // Optional populated fields
  digitalItem?: {
    id: number;
    title: string;
    coverImage?: string;
    type?: string;
  };
  digitalFile?: {
    id: number;
    format: string;
    filePath?: string;
  };
}

export interface SaveProgressRequest {
  digitalItemId: number;
  digitalFileId?: number;
  location: string;
  percentage: number;
}

import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

// Upload cover image
export const uploadCoverImage = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const fileUrl = `/uploads/covers/${req.file.filename}`;

    res.status(201).json({
      message: 'Cover image uploaded successfully',
      url: fileUrl,
      filename: req.file.filename,
    });
  } catch (error: any) {
    console.error('Upload cover error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
};

// Upload file (ebook, pdf, etc.)
export const uploadDigitalFile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const fileUrl = `/uploads/files/${req.file.filename}`;

    res.status(201).json({
      message: 'File uploaded successfully',
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  } catch (error: any) {
    console.error('Upload file error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
};

// Delete a file
export const deleteFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { filename } = req.params;
    const { type } = req.query;

    if (!filename || !type) {
      res.status(400).json({ error: 'Filename and type are required' });
      return;
    }

    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const directory = type === 'cover' ? 'covers' : 'files';
    const filePath = path.join(uploadDir, directory, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    // Delete file
    fs.unlinkSync(filePath);

    res.json({ message: 'File deleted successfully' });
  } catch (error: any) {
    console.error('Delete file error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
};

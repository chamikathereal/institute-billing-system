import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary, type UploadApiResponse, type UploadApiErrorResponse } from 'cloudinary';
import { Readable } from 'node:stream';

export interface UploadedFileDto {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class UploadService {
  async uploadImage(
    file: UploadedFileDto,
    folder: string = 'courses',
  ): Promise<{ url: string; publicId: string; format: string }> {
    if (!file || !file.buffer) {
      throw new BadRequestException('No image file provided');
    }

    // Validate mime type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.');
    }

    // Limit to 5MB
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('Image file size exceeds 5MB limit.');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `institute-billing/${folder}`,
          resource_type: 'image',
        },
        (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
          if (error) {
            return reject(new BadRequestException(`Cloudinary upload failed: ${error.message}`));
          }
          if (!result) {
            return reject(new BadRequestException('Cloudinary upload returned empty response'));
          }
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
          });
        },
      );

      const stream = Readable.from(file.buffer);
      stream.pipe(uploadStream);
    });
  }
}

import { Injectable } from '@nestjs/common';
import { CloudinaryResponse } from './cloudinary-response';
import { v2 as cloudinary } from 'cloudinary';
@Injectable()
export class CloudinaryService {
  uploadFileFromBuffer(fileBuffer: Buffer): Promise<CloudinaryResponse> {
    return new Promise<CloudinaryResponse>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { resource_type: 'image', folder: 'Zen_Chat' }, // Thêm tùy chọn folder
          (error, result) => {
            if (error) {
              return reject(error);
            }
            resolve(result);
          },
        )
        .end(fileBuffer);
    });
  }
  uploadFile(fileBuffer: any): Promise<CloudinaryResponse> {
    const extension = fileBuffer.originalname.substring(
      fileBuffer.originalname.lastIndexOf('.'),
    );
    if (
      extension === '.mp4' ||
      extension === '.pdf' ||
      extension === '.jpg' ||
      extension === '.png' ||
      extension === '.jpeg'
    ) {
      return new Promise<CloudinaryResponse>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              resource_type: 'auto',
              folder: 'Zen_Chat',
              type: 'upload',
            },
            (error, result) => {
              if (error) {
                return reject(error);
              }
              resolve(result);
            },
          )
          .end(fileBuffer.buffer);
      });
    }
    return new Promise<CloudinaryResponse>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: 'auto',
            folder: 'Zen_Chat',
            type: 'upload',
            public_id: `${fileBuffer.originalname}`,
          },
          (error, result) => {
            if (error) {
              return reject(error);
            }
            resolve(result);
          },
        )
        .end(fileBuffer.buffer);
    });
  }
  deleteImage(publicId: string): Promise<CloudinaryResponse> {
    return new Promise<CloudinaryResponse>((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      });
    });
  }
  async deleteAllImg(imgs: string[]) {
    return imgs.forEach((e) => {
      cloudinary.uploader.destroy(e);
    });
  }
}

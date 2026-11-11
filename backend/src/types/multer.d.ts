declare module 'multer' {
  import { Request } from 'express';

  export interface DiskStorageOptions {
    destination?: (
      req: Request,
      file: { originalname: string; mimetype: string },
      callback: (error: Error | null, destination: string) => void,
    ) => void;
    filename?: (
      req: Request,
      file: { originalname: string; mimetype: string },
      callback: (error: Error | null, filename: string) => void,
    ) => void;
  }

  export function diskStorage(options: DiskStorageOptions): unknown;
}


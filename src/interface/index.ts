export interface DiskStorageOptions {
  destination?:
    | string
    | ((
        // 1
        req: Request,
        file: Express.Multer.File,
        callback: (error: Error | null, destination: string) => void,
      ) => void)
    | undefined;
  filename?( // 2
    req: Request,
    file: Express.Multer.File,
    callback: (error: Error | null, filename: string) => void,
  ): void;
}

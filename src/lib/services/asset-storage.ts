import fs from 'fs';
import path from 'path';

/**
 * Asset Storage Service
 * Downloads media from remote provider URLs into the application's local public storage
 * directory (public/storage/generations/) to protect against provider link expiration (7 days).
 */
export class AssetStorageService {
  private static STORAGE_DIR = path.join(process.cwd(), 'public', 'storage', 'generations');

  /**
   * Ensure the local storage directory exists
   */
  private static ensureStorageDir(): void {
    if (!fs.existsSync(this.STORAGE_DIR)) {
      fs.mkdirSync(this.STORAGE_DIR, { recursive: true });
    }
  }

  /**
   * Downloads a remote asset and persists it to local storage.
   * Returns the relative public URL (e.g. /storage/generations/gen-123.mp4).
   * If remote fetching is unavailable or fails, returns the fallback/original URL.
   */
  static async persistRemoteAsset(
    remoteUrl: string,
    generationId: string,
    mediaType: 'image' | 'video' | 'audio'
  ): Promise<string> {
    try {
      this.ensureStorageDir();

      // If it's already a local relative path, return as is
      if (remoteUrl.startsWith('/storage/generations/')) {
        return remoteUrl;
      }

      // Determine appropriate extension
      let ext = mediaType === 'video' ? '.mp4' : mediaType === 'audio' ? '.mp3' : '.png';
      try {
        const urlObj = new URL(remoteUrl);
        const pathname = urlObj.pathname;
        const candidateExt = path.extname(pathname);
        if (candidateExt && ['.mp4', '.mov', '.webm', '.jpg', '.jpeg', '.png', '.webp', '.mp3', '.wav', '.ogg'].includes(candidateExt.toLowerCase())) {
          ext = candidateExt.toLowerCase();
        }
      } catch {
        // Use default ext if URL parsing fails
      }

      const fileName = `${generationId}${ext}`;
      const filePath = path.join(this.STORAGE_DIR, fileName);
      const relativePublicUrl = `/storage/generations/${fileName}`;

      // Check if file already exists locally
      if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
        return relativePublicUrl;
      }

      // If mock/data URL or test placeholder, write a minimal placeholder if offline
      if (remoteUrl.startsWith('data:') || remoteUrl.startsWith('blob:')) {
        return remoteUrl;
      }

      // Fetch with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s download timeout

      const response = await fetch(remoteUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Studio-Operator-Asset-Sync/1.0',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Fallback to remote URL if download fails (e.g. mock test URLs or DNS)
        return remoteUrl;
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      await fs.promises.writeFile(filePath, buffer);
      return relativePublicUrl;
    } catch (err: any) {
      // Safe logging without credentials
      console.warn(`[AssetStorage] Could not persist remote asset locally: ${err?.message || 'Download error'}. Retaining provider URL.`);
      return remoteUrl;
    }
  }
}

import sharp from 'sharp'

export interface ImageVariant {
  name: string
  buffer: Buffer
  width: number
  height: number
  format: string
  size: number
}

export interface ImageProcessingOptions {
  generateThumbnail?: boolean
  generateMedium?: boolean
  generateWebP?: boolean
  maxWidth?: number
  maxHeight?: number
  quality?: number
}

const DEFAULT_OPTIONS: ImageProcessingOptions = {
  generateThumbnail: true,
  generateMedium: true,
  generateWebP: true,
  maxWidth: 2048,
  maxHeight: 2048,
  quality: 85,
}

/**
 * Process an image file and generate optimized variants
 */
export async function processImage(
  buffer: Buffer,
  filename: string,
  options: ImageProcessingOptions = {}
): Promise<ImageVariant[]> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const variants: ImageVariant[] = []

  // Get original image metadata
  const metadata = await sharp(buffer).metadata()
  const originalWidth = metadata.width || 0
  const originalHeight = metadata.height || 0

  // Process original (optimize but maintain size if under max)
  const shouldResize = originalWidth > opts.maxWidth! || originalHeight > opts.maxHeight!
  
  const originalSharp = sharp(buffer)
  if (shouldResize) {
    originalSharp.resize(opts.maxWidth, opts.maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    })
  }

  const originalOptimized = await originalSharp
    .jpeg({ quality: opts.quality, progressive: true })
    .toBuffer()

  const originalMeta = await sharp(originalOptimized).metadata()
  
  variants.push({
    name: 'original',
    buffer: originalOptimized,
    width: originalMeta.width || 0,
    height: originalMeta.height || 0,
    format: 'jpeg',
    size: originalOptimized.length,
  })

  // Generate thumbnail (300x300)
  if (opts.generateThumbnail) {
    const thumbnail = await sharp(buffer)
      .resize(300, 300, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 80, progressive: true })
      .toBuffer()

    const thumbMeta = await sharp(thumbnail).metadata()
    
    variants.push({
      name: 'thumbnail',
      buffer: thumbnail,
      width: thumbMeta.width || 0,
      height: thumbMeta.height || 0,
      format: 'jpeg',
      size: thumbnail.length,
    })
  }

  // Generate medium size (800x800)
  if (opts.generateMedium && (originalWidth > 800 || originalHeight > 800)) {
    const medium = await sharp(buffer)
      .resize(800, 800, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 85, progressive: true })
      .toBuffer()

    const mediumMeta = await sharp(medium).metadata()
    
    variants.push({
      name: 'medium',
      buffer: medium,
      width: mediumMeta.width || 0,
      height: mediumMeta.height || 0,
      format: 'jpeg',
      size: medium.length,
    })
  }

  // Generate WebP version of original
  if (opts.generateWebP) {
    const webpSharp = sharp(buffer)
    if (shouldResize) {
      webpSharp.resize(opts.maxWidth, opts.maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      })
    }

    const webp = await webpSharp
      .webp({ quality: opts.quality })
      .toBuffer()

    const webpMeta = await sharp(webp).metadata()
    
    variants.push({
      name: 'webp',
      buffer: webp,
      width: webpMeta.width || 0,
      height: webpMeta.height || 0,
      format: 'webp',
      size: webp.length,
    })
  }

  return variants
}

/**
 * Calculate total size saved by optimization
 */
export function calculateSizeSaved(originalSize: number, optimizedSize: number): {
  saved: number
  percentage: number
} {
  const saved = originalSize - optimizedSize
  const percentage = Math.round((saved / originalSize) * 100)
  
  return {
    saved,
    percentage,
  }
}

/**
 * Format bytes to human readable format
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}
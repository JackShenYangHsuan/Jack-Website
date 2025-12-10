const sharp = require('sharp');
const https = require('https');
const http = require('http');

/**
 * Download image from URL
 * @param {string} imageUrl - URL of the image to download
 * @returns {Promise<Buffer>} - Image buffer
 */
function downloadImage(imageUrl) {
  return new Promise((resolve, reject) => {
    const protocol = imageUrl.startsWith('https') ? https : http;

    protocol.get(imageUrl, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: HTTP ${response.statusCode}`));
        return;
      }

      const chunks = [];

      response.on('data', (chunk) => {
        chunks.push(chunk);
      });

      response.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer);
      });

      response.on('error', (error) => {
        reject(new Error(`Download error: ${error.message}`));
      });
    });
  });
}

/**
 * Resize image from 1024x1024 to 1080x1080
 * @param {Buffer} imageBuffer - Input image buffer
 * @returns {Promise<Buffer>} - Resized image buffer
 */
async function resizeImage(imageBuffer) {
  try {
    const resizedBuffer = await sharp(imageBuffer)
      .resize(1080, 1080, {
        fit: 'cover',
        position: 'center'
      })
      .png({
        quality: 95,
        compressionLevel: 9
      })
      .toBuffer();

    return resizedBuffer;
  } catch (error) {
    throw new Error(`Image resize failed: ${error.message}`);
  }
}

/**
 * Process and resize image from URL
 * @param {string} imageUrl - URL of the DALL-E generated image
 * @returns {Promise<Buffer>} - Processed image buffer (1080x1080 PNG)
 */
async function processImage(imageUrl) {
  try {
    console.log('  - Downloading image from DALL-E...');
    const imageBuffer = await downloadImage(imageUrl);

    console.log('  - Resizing image to 1080x1080...');
    const resizedBuffer = await resizeImage(imageBuffer);

    console.log('  ✓ Image processed successfully');
    return resizedBuffer;

  } catch (error) {
    console.error('  ✗ Image processing failed:', error.message);
    throw new Error(`Failed to process image: ${error.message}`);
  }
}

/**
 * Process multiple images in parallel
 * @param {Array<string>} imageUrls - Array of DALL-E image URLs
 * @returns {Promise<Array<Buffer>>} - Array of processed image buffers
 */
async function processMultipleImages(imageUrls) {
  try {
    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
      throw new Error('No image URLs provided');
    }

    console.log(`\nProcessing ${imageUrls.length} images...`);

    const processPromises = imageUrls.map((url, index) =>
      processImage(url)
        .then(buffer => ({ index, buffer, success: true }))
        .catch(error => {
          console.error(`Failed to process image ${index + 1}:`, error.message);
          return { index, buffer: null, success: false };
        })
    );

    const results = await Promise.all(processPromises);

    // Extract successful buffers
    const successfulBuffers = results
      .filter(result => result.success)
      .map(result => result.buffer);

    if (successfulBuffers.length === 0) {
      throw new Error('All image processing operations failed');
    }

    if (successfulBuffers.length < imageUrls.length) {
      console.warn(`⚠ Only ${successfulBuffers.length}/${imageUrls.length} images processed successfully`);
    } else {
      console.log(`✓ All ${successfulBuffers.length} images processed successfully`);
    }

    return successfulBuffers;

  } catch (error) {
    console.error('Error in processMultipleImages:', error.message);
    throw error;
  }
}

/**
 * Convert image buffer to base64 data URL
 * @param {Buffer} imageBuffer - Image buffer
 * @returns {string} - Base64 data URL
 */
function bufferToBase64(imageBuffer) {
  const base64 = imageBuffer.toString('base64');
  return `data:image/png;base64,${base64}`;
}

/**
 * Convert multiple image buffers to base64 data URLs
 * @param {Array<Buffer>} imageBuffers - Array of image buffers
 * @returns {Array<string>} - Array of base64 data URLs
 */
function buffersToBase64(imageBuffers) {
  return imageBuffers.map(buffer => bufferToBase64(buffer));
}

/**
 * Get image metadata
 * @param {Buffer} imageBuffer - Image buffer
 * @returns {Promise<Object>} - Image metadata (width, height, format, size)
 */
async function getImageMetadata(imageBuffer) {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: imageBuffer.length
    };
  } catch (error) {
    throw new Error(`Failed to get image metadata: ${error.message}`);
  }
}

module.exports = {
  downloadImage,
  resizeImage,
  processImage,
  processMultipleImages,
  bufferToBase64,
  buffersToBase64,
  getImageMetadata
};

// configs/imageKit.js
import ImageKit from 'imagekit';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env to ensure environment variables are available
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

console.log('🔍 ImageKit Configuration:');
console.log('Public Key:', process.env.IMAGEKIT_PUBLIC_KEY ? 'Set' : 'Not set');
console.log('Private Key:', process.env.IMAGEKIT_PRIVATE_KEY ? 'Set' : 'Not set');
console.log('URL Endpoint:', process.env.IMAGEKIT_URL_ENDPOINT);

const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY || 'your_public_key',
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY || 'your_private_key',
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/your_imagekit_id'
});

// Add debug method to track ImageKit calls
const originalUpload = imagekit.upload;
imagekit.upload = function(options) {
    console.log('🔍 ImageKit.upload called with:', {
        fileName: options.fileName,
        fileSize: options.file?.length || options.file?.size,
        fileType: typeof options.file,
        hasBuffer: Buffer.isBuffer(options.file)
    });
    
    return originalUpload.call(this, options).catch(error => {
        console.error('🔍 ImageKit.upload error:', error);
        console.error('🔍 ImageKit.upload error details:', {
            message: error.message,
            code: error.code,
            stack: error.stack
        });
        throw error;
    });
};

export default imagekit;
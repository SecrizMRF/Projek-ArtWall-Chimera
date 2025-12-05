import multer from "multer";
import path from "path";

// Use memory storage for production compatibility
const storage = multer.memoryStorage();

export const upload = multer({storage})
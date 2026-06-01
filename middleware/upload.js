const multer = require('multer');
const path = require('path');

// Configure storage
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: function(req, file, cb) {
        cb(null, Date.now() + '_' + file.originalname);
    }
});

// File filter for images
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only images and PDF files are allowed'));
    }
};

// Initialize multer
const upload = multer({
    storage: storage,
    limits: { fileSize: 5242880 }, // 5MB
    fileFilter: fileFilter
});

// Export different upload configurations
exports.uploadSingle = (fieldName) => upload.single(fieldName);
exports.uploadMultiple = (fieldName, maxCount) => upload.array(fieldName, maxCount);
exports.uploadFields = (fields) => upload.fields(fields);
exports.upload = upload;

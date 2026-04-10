const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        return {
            folder: "amprovans_client_cars",
            format: file.mimetype.split("/")[1], // auto detect file type
            public_id: Date.now() + "-" + file.originalname
        };
    }
});

const clientUpload = multer({ storage });

module.exports = clientUpload;
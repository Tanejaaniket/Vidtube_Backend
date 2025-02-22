import multer from "multer";

//* We first will upload file on server then we will upload on cloudinary
//* File on server is uploaded using multer

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    //* The backend project directory is cosidered to be the current directory therefore .public/temp explains itself
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now();
    cb(null, file.fieldname + "-" + uniqueSuffix);
  },
});

export const upload = multer({ storage: storage });

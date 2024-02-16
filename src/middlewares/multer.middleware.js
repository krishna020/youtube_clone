import multer from 'multer';
import { v4 as uuidv4 } from 'uuid'

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
      //const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      const { originalname } = file
  
      //cb(null, file.fieldname + '-' + uniqueSuffix)
      cb(null, `${originalname}${v4()}`)
    }
  })
  const fileFilter = (req, file, cb) => {
    // Check the MIME type for each file individually
    const { mimetype } = file;
  
    // To reject this file, pass `false`
    if (mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
      cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE'), false);
    } else {
      cb(null, true);
    }
  };
  
  const upload = multer({ storage, fileFilter, limits: { fileSize: 3 * 1024*1024} })
  export default upload
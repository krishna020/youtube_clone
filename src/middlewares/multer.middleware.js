import multer from 'multer';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
      //const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      const { originalname } = file
  
      //cb(null, file.fieldname + '-' + uniqueSuffix)
      cb(null, `${originalname}`)
    }
  })
  
  
  const upload = multer({ storage })
  export default upload
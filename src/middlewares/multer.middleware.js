import multer from 'multer'; 

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/temp")
  },
  filename: function (req, file, cb) {
    // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) // Generates a unique suffix using the current timestamp and a random number ---> do it after end of project
    // console.log("file", file)

    cb(null, file.originalname) // Use the original file name as the filename in the destination folder
    // cb(null, file.fieldname + '-' + uniqueSuffix) // Use the field name and unique suffix as the filename in the destination folder


  }
})



export const upload  = multer({
    storage,
})
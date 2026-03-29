import { Request } from "express";
import multer , {FileFilterCallback} from "multer";
import path from "path";

const storage = multer.memoryStorage();

const filter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback)=>{
    const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png"];
    const allowedExtensions = [".jpg", ".jpeg", ".png"];
    const extname = path.extname(file.originalname).toLowerCase();

    const isValidMimeType = allowedMimeTypes.includes(file.mimetype);
    const isValidExtensions = allowedExtensions.includes(extname);
    
    if(isValidExtensions && isValidMimeType){
        cb(null, true);
    }else{
        cb(new Error("Invalid file type"));
    }


}

export const upload = multer({
    storage: storage,
    fileFilter: filter,
    limits: {
        fileSize: 1024 * 1024 *5
    }
});
import {v2 as cloudinary} from "cloudinary"
import fs from "fs"


// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});
    
const uploadCloudinary = async (localFilePath) => {
    console.log("Here is the cloudinary cloudname: ", process.env.CLOUDINARY_CLOUD_NAME);
    console.log("Here is the cloudinary apikey: ", process.env.CLOUDINARY_API_KEY);
    console.log("Here is the cloudinary api_secret: ", process.env.CLOUDINARY_API_SECRET);
    
    try {
        if (!localFilePath) return null
        // upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // file has been uploaded
        console.log("file is uploaded on cloudinary ", response.url);
        return response;
        
    } catch (error) {
        console.log("error:", error);
        fs.unlinkSync(localFilePath) //remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}

export {uploadCloudinary}
import { IsBase64, IsIn, IsNotEmpty, IsString } from "class-validator";

export class ImageInfo {
    @IsNotEmpty()
    @IsString()
    @IsIn(['garden', 'forest', 'indoors', 'other'])
    environment: 'garden' | 'forest' | 'indoors' | 'other';
  
    @IsNotEmpty()
    @IsBase64()
    imageData: string;
  
    @IsNotEmpty()
    @IsString()
    location: string;
  }
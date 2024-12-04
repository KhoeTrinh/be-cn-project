import {
  ArrayNotEmpty,
  IsArray,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  Validate,
  IsNotEmpty,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsStrictBase64 implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments) {
    const base64Data = this.stripBase64Prefix(value);
    const regex = /^[A-Za-z0-9+/=]+$/; // Basic base64 regex
    return regex.test(base64Data) && this.isValidBase64(base64Data);
  }

  defaultMessage(args: ValidationArguments) {
    return 'Text ($value) is not a valid base64 image string!';
  }

  private stripBase64Prefix(value: string): string {
    const regex = /^data:image\/[a-zA-Z]*;base64,/;
    return value.replace(regex, '');
  }
  private isValidBase64(value: string) {
    try {
      const buffer = Buffer.from(value, 'base64');
      return buffer.toString('base64') === value;
    } catch (e) {
      return false;
    }
  }
}
export class ImageInfo {
  @IsArray()
  @ArrayNotEmpty()
  @Validate(IsStrictBase64, { each: true })
  images: string[];
}

export class ImageInfoDetails {
  @IsNotEmpty()
  suggestion: {
    id: string;
    name: string;
    probability: number;
    similar_images: Array<{
      id: string;
      url: string;
      license_name: string;
      license_url: string;
      citation: string;
      similarity: number;
      url_small: string;
    }>;
    details: {
      common_names: string[];
      taxonomy: {
        class: string;
        order: string;
        family: string;
        phylum: string;
        kingdom: string;
      };
      url: string;
      inaturalist_id: number;
      rank: string;
      description: {
        value: string;
        citation: string;
        license_name: string;
        license_url: string;
      };
      images: any;
      role: any;
      danger_description: any;
      language: string;
      entity_id: string;
    };
  };
}

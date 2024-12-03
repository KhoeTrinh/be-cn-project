import { ArrayNotEmpty, IsArray, ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments, Validate } from 'class-validator';

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

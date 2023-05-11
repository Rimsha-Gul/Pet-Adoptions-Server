import Joi from "joi";

const usernameSchema = Joi.string().min(3).max(32);
const emailSchema = Joi.string().email();
const addressSchema = Joi.string();
const passwordSchema = Joi.string().min(6).max(1024);
const accessTokenSchema = Joi.string();
const refreshTokenSchema = Joi.string();

export const signUpValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    name: usernameSchema.required(),
    email: emailSchema.required(),
    address: addressSchema.required(),
    password: passwordSchema.required(),
  }).validate(data);

export const loginValidation = (data: any): Joi.ValidationResult =>
  Joi.object({
    email: emailSchema.required(),
    password: passwordSchema.required(),
  }).validate(data);

// export const logoutValidation = (data: any): Joi.ValidationResult =>
//   Joi.object({
//     refreshToken: refreshTokenSchema.required(),
//   }).validate(data);

// export const sessionValidation = (data: any): Joi.ValidationResult =>
//   Joi.object({
//     authorization: Joi.string()
//       .required()
//       .pattern(/^Bearer [a-zA-Z0-9\-._~+/]+=*$/),
//     accessToken: accessTokenSchema.required(),
//   }).validate(data);

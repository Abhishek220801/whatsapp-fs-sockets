import { z } from "zod";

const usernameSchema = z.email("Username must be a valid email address")
  .min(5, "Email must be at least 5 characters")  
  .max(254, "Email must not exceed 254 characters"); // max email length per standards

const passwordSchema = z.string()
    .min(8, "Password must be at least 8 characters")
    .max(64, "Password too long")
    .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    );

export {usernameSchema, passwordSchema}
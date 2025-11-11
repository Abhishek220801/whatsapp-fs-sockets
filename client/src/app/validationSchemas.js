import { z } from "zod";

export const usernameSchema = z.string()
    .min(3, "Username must be at least 4 characters")
    .max(30, "Username must not exceed 20 characters")
    .regex(
        /^[a-zA-Z][a-zA-Z0-9_-]*$/,
        "Username must start with a letter and contain only letters, numbers, underscores or hyphens"
    );

export const passwordSchema = z.string()
    .min(8, "Password must be at least 8 characters")
    .max(64, "Password too long")
    .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    );

const { z } = require('zod');

const emailSchema = z.string().email();

function isGmail(email) {
  const normalized = String(email || '').trim().toLowerCase();
  return normalized.endsWith('@gmail.com');
}

const registerSchema = z.object({
  username: z.string().min(2).max(40),
  email: emailSchema,
  phone: z
    .string()
    .min(7)
    .max(20)
    .regex(/^[+0-9()\-\s]{7,20}$/, 'Invalid phone number'),
  password: z.string().min(8).max(72),
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(72),
});

const cityQuerySchema = z.object({
  query: z.string().min(1).max(120),
});

module.exports = {
  isGmail,
  registerSchema,
  loginSchema,
  cityQuerySchema,
};

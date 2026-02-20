const { z } = require('zod');

const emailSchema = z.string().email();

function isGmail(email) {
  const normalized = String(email || '').trim().toLowerCase();
  return normalized.endsWith('@gmail.com');
}

const registerSchema = z.object({
  email: emailSchema,
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

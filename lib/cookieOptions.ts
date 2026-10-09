export const cookieBase = {
  httpOnly: true,
  secure: Boolean(process.env.RENDER), 
  sameSite: "lax" as const,
};

export const loginCookieOptions = {
  ...cookieBase,
  maxAge: 7 * 24 * 60 * 60 * 1000, 
};
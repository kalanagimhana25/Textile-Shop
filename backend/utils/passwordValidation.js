export function validatePassword(password) {
  return typeof password === "string" &&
    password.length >= 10 &&
    Buffer.byteLength(password, "utf8") <= 72 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password);
}

import crypto from "crypto";

const KEY_LENGTH = 64;
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;

type ParsedHash = {
  salt: string;
  derivedKeyHex: string;
};

function parseHash(storedHash: string): ParsedHash | null {
  const [algorithm, salt, derivedKeyHex] = storedHash.split(":");
  if (algorithm !== "scrypt" || !salt || !derivedKeyHex) {
    return null;
  }
  return { salt, derivedKeyHex };
}

function scryptAsync(plainTextPassword: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(
      plainTextPassword,
      salt,
      KEY_LENGTH,
      { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P },
      (err, derivedKey) => {
        if (err) return reject(err);
        resolve(derivedKey as Buffer);
      }
    );
  });
}

export async function hashPassword(plainTextPassword: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scryptAsync(plainTextPassword, salt);
  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(plainTextPassword: string, storedHash: string): Promise<boolean> {
  const parsed = parseHash(storedHash);
  if (!parsed) return false;

  const expected = Buffer.from(parsed.derivedKeyHex, "hex");
  const actual = await scryptAsync(plainTextPassword, parsed.salt);

  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(expected, actual);
}

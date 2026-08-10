import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

const SCRYPT_KEY_LENGTH = 64;
const SCRYPT_MAXMEM = 256 * 1024 * 1024;
const SCRYPT_PARAMS = { N: 2 ** 17, r: 8, p: 1 } as const;

type StoredPassword = {
  salt: string;
  hash: string;
  options: ScryptOptions;
  current: boolean;
};

function derive(password: string, salt: string, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, SCRYPT_KEY_LENGTH, options, (error, derived) => {
      if (error) reject(error);
      else resolve(derived);
    });
  });
}

function parseStoredPassword(stored: string): StoredPassword | null {
  const encoded = stored.split("$");
  if (encoded.length === 6 && encoded[0] === "scrypt") {
    const [, rawN, rawR, rawP, salt, hash] = encoded;
    const N = Number(rawN);
    const r = Number(rawR);
    const p = Number(rawP);
    const validParams = Number.isInteger(N) && N >= 2 ** 14 && N <= SCRYPT_PARAMS.N
      && (N & (N - 1)) === 0
      && Number.isInteger(r) && r >= 1 && r <= SCRYPT_PARAMS.r
      && Number.isInteger(p) && p >= 1 && p <= 10;
    if (!validParams || !salt || !/^[a-f0-9]+$/i.test(hash)) return null;
    return {
      salt,
      hash,
      options: { N, r, p, maxmem: SCRYPT_MAXMEM },
      current: N === SCRYPT_PARAMS.N && r === SCRYPT_PARAMS.r && p === SCRYPT_PARAMS.p,
    };
  }

  const legacy = stored.split(":");
  if (legacy.length !== 2 || !legacy[0] || !/^[a-f0-9]+$/i.test(legacy[1])) return null;
  return {
    salt: legacy[0],
    hash: legacy[1],
    options: { N: 2 ** 14, r: 8, p: 1, maxmem: SCRYPT_MAXMEM },
    current: false,
  };
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = await derive(password, salt, { ...SCRYPT_PARAMS, maxmem: SCRYPT_MAXMEM });
  return `scrypt$${SCRYPT_PARAMS.N}$${SCRYPT_PARAMS.r}$${SCRYPT_PARAMS.p}$${salt}$${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parsed = parseStoredPassword(stored);
  if (!parsed) return false;
  try {
    const expected = Buffer.from(parsed.hash, "hex");
    if (expected.length !== SCRYPT_KEY_LENGTH) return false;
    const derived = await derive(password, parsed.salt, parsed.options);
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

export function passwordNeedsRehash(stored: string): boolean {
  return parseStoredPassword(stored)?.current !== true;
}

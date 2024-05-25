import * as bcrypt from 'bcrypt';
export async function hashPassword(rawPassword: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(rawPassword, salt);
}
export async function compareHas(rawPassword: string, originPassword: string) {
  return bcrypt.compare(rawPassword, originPassword);
}

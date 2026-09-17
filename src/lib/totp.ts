import 'server-only';
import { createCipheriv, createDecipheriv, createHmac, createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { getEnv } from './env';
const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function key(){return createHash('sha256').update(getEnv().AUTH_SECRET).digest();}
export function newTotpSecret(){const bytes=randomBytes(20);let bits=0,value=0,out='';for(const byte of bytes){value=(value<<8)|byte;bits+=8;while(bits>=5){out+=alphabet[(value>>>(bits-5))&31];bits-=5;}}return out;}
function decode(secret:string){let bits=0,value=0;const out:number[]=[];for(const char of secret.replace(/\s/g,'').toUpperCase()){const n=alphabet.indexOf(char);if(n<0)throw new Error('invalid secret');value=(value<<5)|n;bits+=5;if(bits>=8){out.push((value>>>(bits-8))&255);bits-=8;}}return Buffer.from(out);}
export function totpCode(secret:string,time=Date.now()){const counter=Buffer.alloc(8);counter.writeBigUInt64BE(BigInt(Math.floor(time/30000)));const mac=createHmac('sha1',decode(secret)).update(counter).digest();const offset=mac[19]&15;return String((mac.readUInt32BE(offset)&0x7fffffff)%1000000).padStart(6,'0');}
export function verifyTotp(secret:string,code:string){if(!/^\d{6}$/.test(code))return false;return [-30000,0,30000].some(offset=>timingSafeEqual(Buffer.from(totpCode(secret,Date.now()+offset)),Buffer.from(code)));}
export function encryptTotp(secret:string){const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key(),iv);const data=Buffer.concat([cipher.update(secret,'utf8'),cipher.final()]);return `${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${data.toString('base64url')}`;}
export function decryptTotp(value:string){const [iv,tag,data]=value.split('.');if(!iv||!tag||!data)throw new Error('invalid secret');const decipher=createDecipheriv('aes-256-gcm',key(),Buffer.from(iv,'base64url'));decipher.setAuthTag(Buffer.from(tag,'base64url'));return Buffer.concat([decipher.update(Buffer.from(data,'base64url')),decipher.final()]).toString('utf8');}

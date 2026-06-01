import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function encodeId(filename: string): string {
  return Buffer.from(filename).toString('base64url')
}

export function decodeId(id: string): string {
  return Buffer.from(id, 'base64url').toString('utf8')
}

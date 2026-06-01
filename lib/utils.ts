import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function encodeId(filename: string): string {
  const bytes = new TextEncoder().encode(filename)
  const bin = Array.from(bytes, b => String.fromCodePoint(b)).join('')
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

export function decodeId(id: string): string {
  const b64 = id.replace(/-/g, '+').replace(/_/g, '/')
  const padded = b64 + '='.repeat((4 - b64.length % 4) % 4)
  const bin = atob(padded)
  const bytes = Uint8Array.from(bin, c => c.codePointAt(0)!)
  return new TextDecoder().decode(bytes)
}

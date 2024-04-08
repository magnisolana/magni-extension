import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortenAddress(
  address: string,
  prefixLength = 4,
  suffixLength = 4,
) {
  if (!address) {
    return "nothing";
  }

  if (address.length <= prefixLength + suffixLength) {
    return address;
  }

  const prefix = address.substring(0, prefixLength);
  const suffix = address.substring(address.length - suffixLength);

  return `${prefix}...${suffix}`;
}

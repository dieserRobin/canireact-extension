import browser from "webextension-polyfill";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function isProduction(): boolean {
  const manifest = browser.runtime.getManifest();
  return "update_url" in manifest;
}

export function log(...args: any[]): void {
  const time = new Date().toLocaleTimeString();
  console.log(
    `${time} %c canireact `,
    "background-color: red; font-weight: bold; text-transform: uppercase;",
    ...args
  );
}

export function hasTimeElapsed(uploadedAt: string, hours: number): boolean {
  const uploadedTime = new Date(uploadedAt).getTime();
  const currentTime = new Date().getTime();
  const elapsedHours = (currentTime - uploadedTime) / 1000 / 60 / 60;
  return elapsedHours >= hours;
}

export function isSponsorBlockInstalled() {
  return document.querySelector("#sponsorblock-document-script") !== null;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

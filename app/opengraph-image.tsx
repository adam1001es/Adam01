import { ImageResponse } from "next/og";
import { OgImageLayout } from "@/lib/ogImageLayout";

export const runtime = "edge";
export const alt = "Lernwerk – Islamischer Religionsunterricht Österreich";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(<OgImageLayout />, size);
}

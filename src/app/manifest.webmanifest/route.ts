import { NextResponse } from "next/server";

export function GET(req: Request) {
  const cookieHeader = req.headers.get("cookie") || "";
  const theme = cookieHeader.includes("theme=light") ? "light" : "dark";

  const backgroundColor = theme === "light" ? "#FFFFFF" : "#000000";
  const themeColor = theme === "light" ? "#23C38D" : "#1A4035";

  return NextResponse.json(
    {
      name: "Splaza Online Store",
      short_name: "Splaza",
      description: "Get local, online.",
      start_url: "/",
      display: "standalone",
      background_color: backgroundColor,
      theme_color: themeColor,
      icons: [
        {
          src: "/icons/pwa.svg",
          sizes: "any",
          type: "image/png",
        },
      ],
    },
    {
      headers: {
        "Content-Type": "application/manifest+json",
      },
    }
  );
}

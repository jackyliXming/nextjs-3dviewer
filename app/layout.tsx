import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import { Link } from "@heroui/link";
import clsx from "clsx";

import { Providers } from "./providers";

import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning lang="en">
      <head />
      <body
        className={clsx(
          "min-h-screen text-foreground bg-background font-sans antialiased",
          fontSans.variable,
        )}
      >
        <Providers themeProps={{ attribute: "class", defaultTheme: "dark" }}>
          <div className="relative flex flex-col h-screen">
            <Navbar />
            <main className="container mx-auto max-w-7xl pt-16 px-6 flex-grow">
              {children}
            </main>
            <footer className="w-full flex items-center justify-center py-3">
              {/* <Link
                isExternal
                className="flex items-center gap-1 text-current"
                href="https://heroui.com?utm_source=next-app-template"
                title="heroui.com homepage"
              >
                <span className="text-default-600">Powered by</span>
                <p className="text-primary">HeroUI</p>
              </Link> */}
              <a
                        className="flex items-center gap-2 hover:underline hover:underline-offset-4"
                        href="https://gomore.com.tw/2015/index.html"
                        target="_blank"
                        rel="noopener noreferrer"
                      >                        
                        Go to Gomore Website →
                      </a>
                      <a
                        className="flex items-center gap-2 hover:underline hover:underline-offset-4"
                        href="https://gomore.com.tw/2015/index.html"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        2015 © Gomore Building Envelope Technology Co. Ltd | TEL:02 2797-9977 FAX:02 2797 2588
                      </a>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}

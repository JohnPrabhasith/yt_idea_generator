import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import NavBar from "@/components/NavBar";
import { Toaster } from "@/components/ui/toaster";

const poppins = Poppins({
  weight: ["100" ,"900", "500", "600", "700"],
  style: 'normal',
  subsets : ['latin'],
});

export const metadata: Metadata = {
  title: "Inspiro Bot",
  description: "A Youtube Concept Generator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${poppins.className}antialiased`}>
          <div className="max-w-6xl mx-auto min-h-screen">
            <NavBar/>
            {children}
            <Toaster/>
          </div>
        </body>
    </html>
    </ClerkProvider>
  );
}

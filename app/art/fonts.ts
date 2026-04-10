import { Cormorant } from "next/font/google";

/** Elegant, slightly thin serif — body 300, titles often light/normal for a gallery feel. */
export const artSiteFont = Cormorant({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

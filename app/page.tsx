import { redirect } from "next/navigation";

/** Primary public site is the art microsite — avoids an empty-looking home stub in dev. */
export default function Home() {
  redirect("/art");
}

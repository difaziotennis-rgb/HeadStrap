import { redirect } from "next/navigation";

/** Primary public entry is lesson booking; art lives at /art. */
export default function Home() {
  redirect("/book");
}

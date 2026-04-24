import { redirect } from "next/navigation";

/**
 * De root-route stuurt direct door naar de inbox. Niet-ingelogde
 * bezoekers worden door de middleware afgevangen en naar /login geleid.
 */
export default function RootPage() {
  redirect("/inbox");
}

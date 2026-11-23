import { redirect } from "next/navigation";

export default function RecuperarPage() {
  redirect("/login?view=recuperar");
}

"use client";

import { redirect } from "next/navigation";

/** Keep existing links to the retired random screen pointing at the main page. */
export default function RandomRedirectPage() {
  redirect("/main");
}

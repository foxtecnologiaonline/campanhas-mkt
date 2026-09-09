"use server";

import { redirect } from "next/navigation";
import { getUserClient } from "@/lib/supabase/server-client";

export async function signOut(): Promise<void> {
  const supabase = await getUserClient();
  await supabase.auth.signOut();
  redirect("/login");
}

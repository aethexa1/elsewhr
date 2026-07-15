// elsewhr — home (server): fetches people, hands off to the shell
// Replaces app/page.tsx

import { supabase } from "@/lib/supabaseClient";
import HomeShell, { type FeedProfile } from "./HomeShell";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, user_id, name, photo, headline, location, seeking, mindset, accent, artifacts, dest_place, dest_term")
    .order("id", { ascending: false });

  return <HomeShell profiles={(data ?? []) as FeedProfile[]} hadError={!!error} />;
}

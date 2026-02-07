import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // If profile is missing, don't just sit here, go home
  if (!profile) return redirect("/");

  if (profile.role === "admin") return redirect("/protected/admin");
  if (profile.role === "tutor") return redirect("/protected/tutor");
  
  // Default for students
  return redirect("/protected/student-board");
}
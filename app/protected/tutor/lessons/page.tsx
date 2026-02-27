import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TutorSidebar } from "../components/structure/sidebar";
import { TutorHeader } from "../components/structure/header";
import { TutorLessonsClient } from "./lessons-client";

export default async function TutorLessonsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "tutor") return redirect("/");

  const [{ data: lessons }, { data: categories }] = await Promise.all([
    supabase
      .from("lessons")
      .select("id, title_en, title_fr, slug, order_index, content_type, duration_minutes, description_en, description_fr, video_id, body_content_en, body_content_fr, created_at, created_by, category_id, lesson_categories(name_en, name_fr, color_code)")
      .order("order_index", { ascending: true }),
    supabase.from("lesson_categories").select("id, name_en, name_fr, color_code").order("name_en"),
  ]);

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] dark:bg-[#0B0F1A]">
      <TutorSidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <TutorHeader title="Lessons" subtitle="Create and manage platform lessons" />
        <main className="flex-1 overflow-y-auto p-6">
          <TutorLessonsClient
            initialLessons={(lessons ?? []) as any[]}
            categories={categories ?? []}
            currentUserId={user.id}
          />
        </main>
      </div>
    </div>
  );
}

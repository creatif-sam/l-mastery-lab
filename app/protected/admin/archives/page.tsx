import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminSidebar } from "../components/structure/sidebar";
import { AdminHeader } from "../components/structure/header";
import ArchivesClient from "./archives-client";

export default async function AdminArchivesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; search?: string; page?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "admin") return redirect("/");

  const params = await searchParams;
  const PAGE_SIZE = 50;
  const page = Math.max(1, Number(params.page ?? 1));
  const from = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from("score_archives")
    .select("*", { count: "exact" })
    .order("archived_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (params.type && params.type !== "all") {
    query = query.eq("score_type", params.type);
  }
  if (params.search && params.search.trim() !== "") {
    query = query.ilike("user_name", `%${params.search.trim()}%`);
  }

  const { data: archives, count } = await query;

  // KPI counts
  const [
    { count: totalCount },
    { count: quizCount },
    { count: arenaCount },
    { count: allCount },
  ] = await Promise.all([
    supabase
      .from("score_archives")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("score_archives")
      .select("*", { count: "exact", head: true })
      .eq("score_type", "quiz"),
    supabase
      .from("score_archives")
      .select("*", { count: "exact", head: true })
      .eq("score_type", "arena"),
    supabase
      .from("score_archives")
      .select("*", { count: "exact", head: true })
      .eq("score_type", "all"),
  ]);

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] dark:bg-[#0B0F1A]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <AdminHeader
          title="Archives & Data"
          subtitle="Log of all reset score events with original values"
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          <ArchivesClient
            archives={archives ?? []}
            totalCount={totalCount ?? 0}
            quizCount={quizCount ?? 0}
            arenaCount={arenaCount ?? 0}
            allCount={allCount ?? 0}
            totalPages={totalPages}
            currentPage={page}
            currentType={params.type ?? "all"}
            currentSearch={params.search ?? ""}
          />
        </main>
      </div>
    </div>
  );
}

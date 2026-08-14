"use client";

import { useEffect, useState, useCallback } from "react";
import { Megaphone, Loader2, Calendar, List, Radio, Image as ImageIcon, FolderKanban, Users, Plus, Pencil } from "lucide-react";
import { type PromotionPost, type Campaign } from "@/lib/promotion-types";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CalendarView } from "@/components/admin/divulgacao/calendar-view";
import { ListView } from "@/components/admin/divulgacao/list-view";
import { ChannelsView } from "@/components/admin/divulgacao/channels-view";
import { AssetsView } from "@/components/admin/divulgacao/assets-view";
import { CampaignsView } from "@/components/admin/divulgacao/campaigns-view";
import { GroupsView } from "@/components/admin/divulgacao/groups-view";
import { PostDetailDrawer } from "@/components/admin/divulgacao/post-detail-drawer";
import { PostEditDialog } from "@/components/admin/divulgacao/post-edit-dialog";

export default function DivulgacaoPage() {
  const [flags, setFlags] = useState<Record<string, boolean> | null>(null);
  const [loadingFlags, setLoadingFlags] = useState(true);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<PromotionPost | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<PromotionPost | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    fetch("/api/admin/feature-flags")
      .then((r) => r.json())
      .then((data) => setFlags(data.flags ?? {}))
      .catch(() => setFlags({}))
      .finally(() => setLoadingFlags(false));

    // Carrega campanhas pro dialog de criar/editar post
    fetch("/api/admin/promotion/campaigns")
      .then((r) => r.json())
      .then((data) => setCampaigns(data.campaigns ?? []))
      .catch(() => setCampaigns([]));
  }, []);

  const handleSelectPost = useCallback((post: PromotionPost) => {
    setSelectedPost(post);
    setDrawerOpen(true);
  }, []);

  const handlePostUpdated = useCallback(() => {
    setRefreshKey((k) => k + 1);
    setDrawerOpen(false);
  }, []);

  const handleNewPost = useCallback(() => {
    setEditingPost(null);
    setEditDialogOpen(true);
  }, []);

  const handleEditPost = useCallback(() => {
    if (!selectedPost) return;
    setEditingPost(selectedPost);
    setDrawerOpen(false);
    setEditDialogOpen(true);
  }, [selectedPost]);

  const handlePostSaved = useCallback(() => {
    setRefreshKey((k) => k + 1);
    setEditDialogOpen(false);
    setEditingPost(null);
  }, []);

  if (loadingFlags) {
    return (
      <div className="flex h-40 items-center justify-center text-zinc-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Carregando...
      </div>
    );
  }

  const enabled = flags?.admin_marketing_hub_enabled === true;

  if (!enabled) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-zinc-100">
            <Megaphone className="h-6 w-6 text-emerald-400" />
            Divulgação
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Central de divulgação e calendário editorial.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-10 text-center">
          <Megaphone className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
          <p className="text-sm font-medium text-zinc-300">
            Módulo desativado
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            A feature flag <code className="rounded bg-zinc-800 px-1 py-0.5 text-emerald-400">admin_marketing_hub_enabled</code> está OFF.
            Ative-a via API <code className="rounded bg-zinc-800 px-1 py-0.5 text-emerald-400">POST /api/admin/feature-flags</code> com
            body <code className="rounded bg-zinc-800 px-1 py-0.5 text-emerald-400">{"{\"key\":\"admin_marketing_hub_enabled\",\"value\":true}"}</code>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-zinc-100">
            <Megaphone className="h-6 w-6 text-emerald-400" />
            Divulgação
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Central de divulgação — calendário editorial de 90 dias com 450 postagens.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedPost && drawerOpen && (
            <Button
              onClick={handleEditPost}
              variant="outline"
              className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
            >
              <Pencil className="mr-1.5 h-4 w-4" />
              Editar post
            </Button>
          )}
          <Button
            onClick={handleNewPost}
            className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Nova postagem
          </Button>
        </div>
      </div>

      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="flex w-full overflow-x-auto sm:grid sm:grid-cols-6 sm:w-auto sm:overflow-visible">
          <TabsTrigger value="calendar" className="gap-1.5 text-xs whitespace-nowrap shrink-0">
            <Calendar className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Calendário</span>
            <span className="sm:hidden">Cal</span>
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-1.5 text-xs whitespace-nowrap shrink-0">
            <List className="h-3.5 w-3.5" />
            Lista
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="gap-1.5 text-xs whitespace-nowrap shrink-0">
            <FolderKanban className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Campanhas</span>
            <span className="sm:hidden">Camp</span>
          </TabsTrigger>
          <TabsTrigger value="groups" className="gap-1.5 text-xs whitespace-nowrap shrink-0">
            <Users className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Grupos</span>
            <span className="sm:hidden">Grp</span>
          </TabsTrigger>
          <TabsTrigger value="channels" className="gap-1.5 text-xs whitespace-nowrap shrink-0">
            <Radio className="h-3.5 w-3.5" />
            Canais
          </TabsTrigger>
          <TabsTrigger value="assets" className="gap-1.5 text-xs whitespace-nowrap shrink-0">
            <ImageIcon className="h-3.5 w-3.5" />
            Assets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-4">
          <CalendarView
            key={`cal-${refreshKey}`}
            campaignId={selectedCampaignId}
            onSelectPost={handleSelectPost}
          />
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          <ListView
            key={`list-${refreshKey}`}
            campaignId={selectedCampaignId}
            onSelectPost={handleSelectPost}
          />
        </TabsContent>

        <TabsContent value="campaigns" className="mt-4">
          <CampaignsView
            selectedCampaignId={selectedCampaignId}
            onSelectCampaign={setSelectedCampaignId}
          />
        </TabsContent>

        <TabsContent value="groups" className="mt-4">
          <GroupsView />
        </TabsContent>

        <TabsContent value="channels" className="mt-4">
          <ChannelsView />
        </TabsContent>

        <TabsContent value="assets" className="mt-4">
          <AssetsView />
        </TabsContent>
      </Tabs>

      <PostDetailDrawer
        post={selectedPost}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onPostUpdated={handlePostUpdated}
      />

      <PostEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        editing={editingPost}
        campaigns={campaigns}
        onSaved={handlePostSaved}
      />
    </div>
  );
}

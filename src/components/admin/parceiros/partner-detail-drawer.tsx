"use client";

import { useEffect, useState, useCallback } from "react";
import {
  X,
  Phone,
  Mail,
  MapPin,
  Globe,
  Building2,
  User,
  UserPlus,
  Trash2,
  Calendar,
  Clock,
  CheckCircle2,
  Plus,
  Tag,
  FileText,
  Activity as ActivityIcon,
  History,
  Loader2,
  Instagram,
  Facebook,
  Code2,
  ExternalLink,
} from "lucide-react";
import {
  STAGE_LABELS,
  STAGE_COLORS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  STATUS_LABELS,
  CATEGORY_LABELS,
  ACTIVITY_TYPE_LABELS,
  ACTIVITY_TYPE_ICONS,
  ACTIVITY_STATUS_LABELS,
  formatBRL,
  formatDate,
  formatDateTime,
  timeAgo,
  type Partner,
  type PartnerContact,
  type Opportunity,
  type PartnerActivity,
  type PartnerLog,
  type ActivityType,
  type PartnerStage,
} from "@/lib/partner-types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface Props {
  partnerId: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onPartnerChanged?: () => void;
}

const ACTION_LABELS: Record<string, string> = {
  created: "Criou",
  updated: "Atualizou",
  stage_changed: "Mudou estágio",
  contact_added: "Adicionou contato",
  contact_removed: "Removeu contato",
  contact_opt_out: "Opt-out",
  contact_opt_in: "Opt-in",
  opportunity_created: "Criou oportunidade",
  opportunity_deleted: "Removeu oportunidade",
  activity_created: "Criou atividade",
  activity_completed: "Concluiu atividade",
  activity_deleted: "Removeu atividade",
};

export function PartnerDetailDrawer({ partnerId, open, onOpenChange, onPartnerChanged }: Props) {
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "contacts" | "opportunities" | "activities" | "logs">("overview");
  const [contactDialog, setContactDialog] = useState(false);
  const [activityDialog, setActivityDialog] = useState(false);
  const [opportunityDialog, setOpportunityDialog] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    if (!partnerId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/partners/${partnerId}`);
      if (res.ok) {
        const data = await res.json();
        setPartner(data.partner);
      }
    } finally {
      setLoading(false);
    }
  }, [partnerId]);

  useEffect(() => {
    if (open && partnerId) {
      load();
    }
  }, [open, partnerId, load, refreshKey]);

  const refresh = () => setRefreshKey((k) => k + 1);

  if (!partnerId) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-3xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4 text-zinc-500" />
            <span>{partner?.companyName ?? "Carregando..."}</span>
          </SheetTitle>
        </SheetHeader>

        {loading || !partner ? (
          <div className="mt-8 flex items-center justify-center text-zinc-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Carregando ficha 360°...
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {/* Header info */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="rounded px-2 py-0.5 text-[10px] font-medium"
                  style={{
                    backgroundColor: `${STAGE_COLORS[partner.stage]}20`,
                    color: STAGE_COLORS[partner.stage],
                  }}
                >
                  {STAGE_LABELS[partner.stage]}
                </span>
                <span
                  className="rounded px-2 py-0.5 text-[10px] font-medium"
                  style={{
                    backgroundColor: `${PRIORITY_COLORS[partner.priority]}20`,
                    color: PRIORITY_COLORS[partner.priority],
                  }}
                >
                  Prioridade: {PRIORITY_LABELS[partner.priority]}
                </span>
                <Badge variant="outline" className="border-zinc-700 text-[10px]">
                  {STATUS_LABELS[partner.status]}
                </Badge>
                {partner.category && (
                  <Badge variant="outline" className="border-zinc-700 text-[10px]">
                    {CATEGORY_LABELS[partner.category] ?? partner.category}
                  </Badge>
                )}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
                {partner.city && (
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <MapPin className="h-3 w-3" />
                    {partner.city}
                    {partner.state ? `/${partner.state}` : ""}
                  </div>
                )}
                {partner.phone && (
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <Phone className="h-3 w-3" />
                    {partner.phone}
                  </div>
                )}
                {partner.email && (
                  <div className="flex items-center gap-1.5 truncate text-zinc-400">
                    <Mail className="h-3 w-3 shrink-0" />
                    <span className="truncate">{partner.email}</span>
                  </div>
                )}
                {partner.website && (
                  <a
                    href={partner.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 truncate text-emerald-400 hover:underline"
                  >
                    <Globe className="h-3 w-3 shrink-0" />
                    <span className="truncate">Website</span>
                  </a>
                )}
                {partner.cnpj && (
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <FileText className="h-3 w-3" />
                    CNPJ: {partner.cnpj}
                  </div>
                )}
                {partner.assignedTo && (
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <User className="h-3 w-3" />
                    Resp: {partner.assignedTo}
                  </div>
                )}
              </div>

              {partner.potentialValue && (
                <div className="mt-3 rounded bg-zinc-950 p-2 text-xs">
                  <span className="text-zinc-500">Valor potencial: </span>
                  <span className="font-semibold text-emerald-400">
                    {formatBRL(partner.potentialValue)}/mês
                  </span>
                </div>
              )}

              {partner.tags && (
                <div className="mt-2 flex flex-wrap items-center gap-1">
                  <Tag className="h-3 w-3 text-zinc-500" />
                  {partner.tags.split(",").map((t) => (
                    <Badge key={t} variant="outline" className="border-zinc-700 text-[10px]">
                      {t.trim()}
                    </Badge>
                  ))}
                </div>
              )}

              {partner.notes && (
                <div className="mt-3 rounded bg-zinc-950 p-2 text-xs text-zinc-400">
                  <p className="mb-1 font-medium text-zinc-500">Notas</p>
                  {partner.notes}
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-1 border-b border-zinc-800">
              {[
                { id: "overview", label: "Visão Geral", icon: Building2 },
                { id: "contacts", label: `Contatos (${partner.contacts?.length ?? 0})`, icon: User },
                { id: "opportunities", label: `Oportunidades (${partner.opportunities?.length ?? 0})`, icon: FileText },
                { id: "activities", label: `Atividades (${partner.activities?.length ?? 0})`, icon: ActivityIcon },
                { id: "logs", label: "Histórico", icon: History },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as typeof activeTab)}
                  className={`flex items-center gap-1.5 border-b-2 px-3 py-1.5 text-xs font-medium transition-colors ${
                    activeTab === t.id
                      ? "border-emerald-500 text-emerald-400"
                      : "border-transparent text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <t.icon className="h-3 w-3" />
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {activeTab === "overview" && <OverviewTab partner={partner} />}
            {activeTab === "contacts" && (
              <ContactsTab
                partnerId={partner.id}
                contacts={partner.contacts ?? []}
                onChanged={refresh}
                onOpenAdd={() => setContactDialog(true)}
              />
            )}
            {activeTab === "opportunities" && (
              <OpportunitiesTab
                partnerId={partner.id}
                opportunities={partner.opportunities ?? []}
                contacts={partner.contacts ?? []}
                onChanged={refresh}
                onOpenAdd={() => setOpportunityDialog(true)}
              />
            )}
            {activeTab === "activities" && (
              <ActivitiesTab
                partnerId={partner.id}
                activities={partner.activities ?? []}
                onChanged={refresh}
                onOpenAdd={() => setActivityDialog(true)}
              />
            )}
            {activeTab === "logs" && <LogsTab logs={partner.logs ?? []} />}
          </div>
        )}

        {/* Dialogs */}
        {partner && (
          <>
            <ContactDialog
              open={contactDialog}
              onOpenChange={setContactDialog}
              partnerId={partner.id}
              onSaved={() => {
                setContactDialog(false);
                refresh();
                onPartnerChanged?.();
              }}
            />
            <ActivityDialog
              open={activityDialog}
              onOpenChange={setActivityDialog}
              partnerId={partner.id}
              opportunities={partner.opportunities ?? []}
              onSaved={() => {
                setActivityDialog(false);
                refresh();
                onPartnerChanged?.();
              }}
            />
            <OpportunityDialog
              open={opportunityDialog}
              onOpenChange={setOpportunityDialog}
              partnerId={partner.id}
              contacts={partner.contacts ?? []}
              onSaved={() => {
                setOpportunityDialog(false);
                refresh();
                onPartnerChanged?.();
              }}
            />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function OverviewTab({ partner }: { partner: Partner }) {
  const scores = [
    { label: "Relevância", value: partner.relevanceScore },
    { label: "Benefício", value: partner.benefitScore },
    { label: "Reputação", value: partner.reputationScore },
    { label: "Capacidade", value: partner.capacityScore },
    { label: "Risco", value: partner.riskScore, invert: true },
  ].filter((s) => s.value !== null);

  // Extrai redes sociais das notes (salvas pela prospecção)
  const notes = partner.notes || "";
  const phoneMatch = notes.match(/Telefone: (.+)/);
  const whatsappMatch = notes.match(/WhatsApp: (.+)/);
  const websiteMatch = notes.match(/Website: (.+)/) || (partner.website ? [null, partner.website] : null);
  const instagramMatch = notes.match(/Instagram: (.+?)$/m);
  const facebookMatch = notes.match(/Facebook: (.+?)$/m);
  const ratingMatch = notes.match(/Rating: (.+)/);
  const fonteMatch = notes.match(/Fonte: (.+)/);

  const phone = partner.phone || phoneMatch?.[1]?.trim() || null;
  const whatsapp = whatsappMatch?.[1]?.trim() || (phone ? phone.replace(/\D/g, "") : null);
  const website = websiteMatch?.[1]?.trim() || partner.website || null;
  const instagram = instagramMatch?.[1]?.trim() || null;
  const facebook = facebookMatch?.[1]?.trim() || null;
  const rating = ratingMatch?.[1]?.trim() || null;
  const fonte = fonteMatch?.[1]?.trim() || null;

  // Endereço completo para o mapa
  const fullAddress = [partner.address, partner.city, partner.state].filter(Boolean).join(", ");
  const hasAddress = !!fullAddress;
  const mapQuery = encodeURIComponent(`${partner.companyName} ${fullAddress}`);
  const mapEmbedUrl = `https://www.google.com/maps?q=${mapQuery}&output=embed`;
  const mapLinkUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

  const hasWebsite = !!website && !website.includes("instagram.com") && !website.includes("facebook.com");
  const webDevOpportunity = !hasWebsite;

  return (
    <div className="space-y-4 pt-2">
      {/* Info básica */}
      <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <div className="rounded border border-zinc-800 bg-zinc-900 p-2">
          <p className="text-[10px] text-zinc-500">Criado em</p>
          <p className="text-zinc-300">{formatDate(partner.createdAt)}</p>
        </div>
        <div className="rounded border border-zinc-800 bg-zinc-900 p-2">
          <p className="text-[10px] text-zinc-500">Atualizado</p>
          <p className="text-zinc-300">{timeAgo(partner.updatedAt)}</p>
        </div>
        <div className="rounded border border-zinc-800 bg-zinc-900 p-2">
          <p className="text-[10px] text-zinc-500">Origem</p>
          <p className="text-zinc-300">{partner.origin ?? "manual"}</p>
        </div>
        <div className="rounded border border-zinc-800 bg-zinc-900 p-2">
          <p className="text-[10px] text-zinc-500">Categoria</p>
          <p className="text-zinc-300">{partner.category ?? "—"}</p>
        </div>
      </div>

      {/* Contatos e redes sociais */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
        <p className="mb-2 text-xs font-bold text-zinc-400">CONTATOS E PRESENÇA DIGITAL</p>
        <div className="flex flex-wrap gap-2">
          {phone && (
            <a href={`tel:${phone.replace(/\D/g, "")}`} className="flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1.5 text-xs text-emerald-400 transition hover:bg-emerald-500/10">
              <Phone className="h-3.5 w-3.5" /> {phone}
            </a>
          )}
          {whatsapp && (
            <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg border border-green-500/20 bg-green-500/5 px-2.5 py-1.5 text-xs text-green-400 transition hover:bg-green-500/10">
              <ExternalLink className="h-3.5 w-3.5" /> WhatsApp
            </a>
          )}
          {partner.email && (
            <a href={`mailto:${partner.email}`} className="flex items-center gap-1.5 rounded-lg border border-blue-500/20 bg-blue-500/5 px-2.5 py-1.5 text-xs text-blue-400 transition hover:bg-blue-500/10">
              <Mail className="h-3.5 w-3.5" /> {partner.email}
            </a>
          )}
          {hasWebsite && (
            <a href={website!} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1.5 text-xs text-emerald-400 transition hover:bg-emerald-500/10">
              <Globe className="h-3.5 w-3.5" /> Site
            </a>
          )}
          {instagram && (
            <a href={instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg border border-pink-500/20 bg-pink-500/5 px-2.5 py-1.5 text-xs text-pink-400 transition hover:bg-pink-500/10">
              <Instagram className="h-3.5 w-3.5" /> Instagram
            </a>
          )}
          {facebook && (
            <a href={facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg border border-blue-500/20 bg-blue-500/5 px-2.5 py-1.5 text-xs text-blue-400 transition hover:bg-blue-500/10">
              <Facebook className="h-3.5 w-3.5" /> Facebook
            </a>
          )}
          {webDevOpportunity && (
            <span className="flex items-center gap-1.5 rounded-lg border border-purple-500/20 bg-purple-500/5 px-2.5 py-1.5 text-xs font-bold text-purple-400" title="Não tem site próprio — oportunidade de web dev">
              <Code2 className="h-3.5 w-3.5" /> SEM SITE
            </span>
          )}
          {rating && (
            <span className="flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/5 px-2.5 py-1.5 text-xs font-bold text-amber-400">
              ⭐ {rating}
            </span>
          )}
          {!phone && !partner.email && !hasWebsite && !instagram && !facebook && (
            <p className="text-xs text-zinc-500">Nenhum contato cadastrado</p>
          )}
        </div>
      </div>

      {/* Mapa do Google Maps embed */}
      {hasAddress && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-bold text-zinc-400">ENDEREÇO E LOCALIZAÇÃO</p>
            <a href={mapLinkUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 hover:underline">
              <ExternalLink className="h-3 w-3" /> Abrir no Maps
            </a>
          </div>
          <div className="mb-2 flex items-start gap-2 text-xs text-zinc-300">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-500" />
            <span>{fullAddress}</span>
          </div>
          <div className="overflow-hidden rounded-lg border border-zinc-800">
            <iframe
              src={mapEmbedUrl}
              width="100%"
              height="250"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`Mapa de ${partner.companyName}`}
            />
          </div>
        </div>
      )}

      {/* Scores de qualificação */}
      {scores.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-zinc-400">Scores de qualificação</p>
          <div className="space-y-1.5">
            {scores.map((s) => (
              <div key={s.label} className="flex items-center gap-2">
                <span className="w-20 text-[10px] text-zinc-500">{s.label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded bg-zinc-950">
                  <div
                    className={`h-full ${s.invert ? "bg-red-500" : "bg-emerald-500"}`}
                    style={{ width: `${s.value}%` }}
                  />
                </div>
                <span className="w-8 text-right text-[10px] font-medium text-zinc-300">
                  {s.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notas */}
      {partner.notes && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
          <p className="mb-1 text-xs font-bold text-zinc-400">NOTAS</p>
          <p className="whitespace-pre-wrap text-xs text-zinc-400">{partner.notes}</p>
        </div>
      )}
    </div>
  );
}

function ContactsTab({
  partnerId,
  contacts,
  onChanged,
  onOpenAdd,
}: {
  partnerId: string;
  contacts: PartnerContact[];
  onChanged: () => void;
  onOpenAdd: () => void;
}) {
  const handleDelete = async (c: PartnerContact) => {
    if (!confirm(`Remover contato ${c.name}?`)) return;
    const res = await fetch(`/api/admin/partners/${partnerId}/contacts/${c.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast.success("Contato removido");
      onChanged();
    }
  };

  const toggleOptOut = async (c: PartnerContact) => {
    const res = await fetch(`/api/admin/partners/${partnerId}/contacts/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optOut: !c.optOut }),
    });
    if (res.ok) {
      toast.success(c.optOut ? "Opt-in registrado" : "Opt-out registrado");
      onChanged();
    }
  };

  return (
    <div className="space-y-2 pt-2">
      <div className="flex justify-end">
        <Button size="sm" onClick={onOpenAdd} className="h-7 gap-1 text-xs">
          <UserPlus className="h-3 w-3" />
          Adicionar contato
        </Button>
      </div>

      {contacts.length === 0 ? (
        <p className="py-6 text-center text-xs text-zinc-500">
          Nenhum contato cadastrado
        </p>
      ) : (
        contacts.map((c) => (
          <div
            key={c.id}
            className="rounded-lg border border-zinc-800 bg-zinc-900 p-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-zinc-100">{c.name}</p>
                  {c.isPrimary && (
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">
                      Primário
                    </Badge>
                  )}
                  {c.optOut && (
                    <Badge className="bg-red-500/10 text-red-400 border-red-500/30 text-[10px]">
                      Opt-out
                    </Badge>
                  )}
                </div>
                {c.role && <p className="text-xs text-zinc-500">{c.role}</p>}
                <div className="mt-1 space-y-0.5 text-[10px] text-zinc-400">
                  {c.email && <p>✉️ {c.email}</p>}
                  {c.phone && <p>📞 {c.phone}</p>}
                  {c.linkedinUrl && <p>in {c.linkedinUrl}</p>}
                </div>
                {c.notes && (
                  <p className="mt-1 text-[10px] italic text-zinc-600">{c.notes}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <button
                  onClick={() => toggleOptOut(c)}
                  className={`rounded px-1.5 py-0.5 text-[10px] ${
                    c.optOut
                      ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                      : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                  }`}
                >
                  {c.optOut ? "Reativar" : "Opt-out"}
                </button>
                <button
                  onClick={() => handleDelete(c)}
                  className="text-zinc-600 hover:text-red-400"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function OpportunitiesTab({
  partnerId,
  opportunities,
  contacts,
  onChanged,
  onOpenAdd,
}: {
  partnerId: string;
  opportunities: Opportunity[];
  contacts: PartnerContact[];
  onChanged: () => void;
  onOpenAdd: () => void;
}) {
  const handleDelete = async (o: Opportunity) => {
    if (!confirm(`Remover oportunidade "${o.title}"?`)) return;
    const res = await fetch(`/api/admin/partners/${partnerId}/opportunities/${o.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast.success("Oportunidade removida");
      onChanged();
    }
  };

  const moveStage = async (o: Opportunity, newStage: PartnerStage) => {
    const res = await fetch(`/api/admin/partners/${partnerId}/opportunities/${o.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: newStage }),
    });
    if (res.ok) {
      toast.success(`${o.title} → ${STAGE_LABELS[newStage]}`);
      onChanged();
    }
  };

  return (
    <div className="space-y-2 pt-2">
      <div className="flex justify-end">
        <Button size="sm" onClick={onOpenAdd} className="h-7 gap-1 text-xs">
          <Plus className="h-3 w-3" />
          Nova oportunidade
        </Button>
      </div>

      {opportunities.length === 0 ? (
        <p className="py-6 text-center text-xs text-zinc-500">
          Nenhuma oportunidade cadastrada
        </p>
      ) : (
        opportunities.map((o) => (
          <div
            key={o.id}
            className="rounded-lg border border-zinc-800 bg-zinc-900 p-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-zinc-100">{o.title}</p>
                {o.description && (
                  <p className="mt-0.5 text-xs text-zinc-500 line-clamp-2">{o.description}</p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-zinc-500">
                  {o.potentialValue && (
                    <span className="font-medium text-emerald-400">
                      {formatBRL(o.potentialValue)}
                    </span>
                  )}
                  {o.billingModel && (
                    <Badge variant="outline" className="border-zinc-700 text-[10px]">
                      Cobrança: {o.billingModel}
                    </Badge>
                  )}
                  {o.expectedCloseAt && (
                    <span>Fecha: {formatDate(o.expectedCloseAt)}</span>
                  )}
                  {o.contact && (
                    <span>Contato: {o.contact.name}</span>
                  )}
                  {o.wonAt && (
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">
                      Ganho em {formatDate(o.wonAt)}
                    </Badge>
                  )}
                  {o.lostAt && (
                    <Badge className="bg-red-500/10 text-red-400 border-red-500/30 text-[10px]">
                      Perdido em {formatDate(o.lostAt)}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Select
                  value={o.stage}
                  onValueChange={(v) => moveStage(o, v as PartnerStage)}
                >
                  <SelectTrigger className="h-6 w-32 text-[10px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STAGE_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button
                  onClick={() => handleDelete(o)}
                  className="text-zinc-600 hover:text-red-400"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function ActivitiesTab({
  partnerId,
  activities,
  onChanged,
  onOpenAdd,
}: {
  partnerId: string;
  activities: PartnerActivity[];
  onChanged: () => void;
  onOpenAdd: () => void;
}) {
  const handleComplete = async (a: PartnerActivity) => {
    const res = await fetch(`/api/admin/partners/${partnerId}/activities/${a.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "done" }),
    });
    if (res.ok) {
      toast.success("Atividade concluída");
      onChanged();
    }
  };

  const handleDelete = async (a: PartnerActivity) => {
    if (!confirm(`Remover atividade "${a.title}"?`)) return;
    const res = await fetch(`/api/admin/partners/${partnerId}/activities/${a.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast.success("Atividade removida");
      onChanged();
    }
  };

  return (
    <div className="space-y-2 pt-2">
      <div className="flex justify-end">
        <Button size="sm" onClick={onOpenAdd} className="h-7 gap-1 text-xs">
          <Plus className="h-3 w-3" />
          Nova atividade
        </Button>
      </div>

      {activities.length === 0 ? (
        <p className="py-6 text-center text-xs text-zinc-500">
          Nenhuma atividade registrada
        </p>
      ) : (
        activities.slice(0, 30).map((a) => (
          <div
            key={a.id}
            className={`rounded-lg border p-3 ${
              a.status === "done"
                ? "border-zinc-800 bg-zinc-950/50 opacity-70"
                : a.status === "canceled"
                  ? "border-zinc-800 bg-zinc-950/50 opacity-50 line-through"
                  : "border-zinc-800 bg-zinc-900"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-base">
                    {ACTIVITY_TYPE_ICONS[a.type]}
                  </span>
                  <p className="text-sm font-medium text-zinc-100">{a.title}</p>
                </div>
                {a.description && (
                  <p className="mt-0.5 text-xs text-zinc-500 line-clamp-2">
                    {a.description}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-zinc-500">
                  <Badge variant="outline" className="border-zinc-700 text-[10px]">
                    {ACTIVITY_TYPE_LABELS[a.type]}
                  </Badge>
                  <span>
                    {a.status === "done"
                      ? `✓ ${a.completedAt ? formatDateTime(a.completedAt) : ""}`
                      : a.scheduledAt
                        ? `📅 ${formatDateTime(a.scheduledAt)}`
                        : "sem data"}
                  </span>
                  {a.assignedTo && <span>👤 {a.assignedTo}</span>}
                  {a.opportunity && <span>🎯 {a.opportunity.title}</span>}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                {a.status === "pending" && (
                  <button
                    onClick={() => handleComplete(a)}
                    className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-400 hover:bg-emerald-500/20"
                  >
                    <CheckCircle2 className="mr-0.5 inline h-2.5 w-2.5" />
                    Concluir
                  </button>
                )}
                <button
                  onClick={() => handleDelete(a)}
                  className="text-zinc-600 hover:text-red-400"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function LogsTab({ logs }: { logs: PartnerLog[] }) {
  if (logs.length === 0) {
    return (
      <p className="py-6 text-center text-xs text-zinc-500">
        Nenhum log de auditoria
      </p>
    );
  }

  return (
    <div className="space-y-1 pt-2">
      {logs.map((log) => (
        <div
          key={log.id}
          className="flex items-start gap-2 rounded border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-xs"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-zinc-700 text-[10px]">
                {ACTION_LABELS[log.action] ?? log.action}
              </Badge>
              <span className="text-zinc-500">{timeAgo(log.createdAt)}</span>
            </div>
            {log.adminEmail && (
              <p className="mt-0.5 text-[10px] text-zinc-600">
                por {log.adminEmail}
              </p>
            )}
            {log.details && (
              <details className="mt-1">
                <summary className="cursor-pointer text-[10px] text-zinc-600 hover:text-zinc-400">
                  ver detalhes
                </summary>
                <pre className="mt-1 overflow-x-auto rounded bg-zinc-950 p-1.5 text-[9px] text-zinc-500">
                  {log.details}
                </pre>
              </details>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ===== Dialogs =====

function ContactDialog({
  open,
  onOpenChange,
  partnerId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  partnerId: string;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setRole("");
      setEmail("");
      setPhone("");
      setIsPrimary(false);
      setNotes("");
    }
  }, [open]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/partners/${partnerId}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, role, email, phone, isPrimary, notes }),
      });
      if (res.ok) {
        onSaved();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Erro ao salvar");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo contato</DialogTitle>
          <DialogDescription>Adicione uma pessoa de contato.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Nome *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 text-sm" />
          </div>
          <div>
            <Label className="text-xs">Cargo</Label>
            <Input value={role} onChange={(e) => setRole(e.target.value)} className="mt-1 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Telefone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 text-sm" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={isPrimary} onCheckedChange={setIsPrimary} />
            <Label className="text-xs">Contato principal</Label>
          </div>
          <div>
            <Label className="text-xs">Notas</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="mt-1 text-sm" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ActivityDialog({
  open,
  onOpenChange,
  partnerId,
  opportunities,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  partnerId: string;
  opportunities: Opportunity[];
  onSaved: () => void;
}) {
  const [type, setType] = useState<ActivityType>("call");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [opportunityId, setOpportunityId] = useState("none");
  const [assignedTo, setAssignedTo] = useState("Clodoaldo Silva");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setType("call");
      setTitle("");
      setDescription("");
      setScheduledAt("");
      setOpportunityId("none");
      setAssignedTo("Clodoaldo Silva");
    }
  }, [open]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/partners/${partnerId}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title,
          description,
          scheduledAt: scheduledAt || undefined,
          opportunityId: opportunityId !== "none" ? opportunityId : undefined,
          assignedTo,
        }),
      });
      if (res.ok) {
        onSaved();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Erro ao salvar");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova atividade</DialogTitle>
          <DialogDescription>Registre uma atividade comercial.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Tipo *</Label>
            <Select value={type} onValueChange={(v) => setType(v as ActivityType)}>
              <SelectTrigger className="mt-1 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ACTIVITY_TYPE_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>
                    {ACTIVITY_TYPE_ICONS[v as ActivityType]} {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Título *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 text-sm" />
          </div>
          <div>
            <Label className="text-xs">Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="mt-1 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Agendar para</Label>
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="mt-1 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Responsável</Label>
              <Input value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className="mt-1 text-sm" />
            </div>
          </div>
          {opportunities.length > 0 && (
            <div>
              <Label className="text-xs">Oportunidade relacionada</Label>
              <Select value={opportunityId} onValueChange={setOpportunityId}>
                <SelectTrigger className="mt-1 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {opportunities.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function OpportunityDialog({
  open,
  onOpenChange,
  partnerId,
  contacts,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  partnerId: string;
  contacts: PartnerContact[];
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [stage, setStage] = useState<PartnerStage>("novo_lead");
  const [potentialValue, setPotentialValue] = useState("");
  const [expectedCloseAt, setExpectedCloseAt] = useState("");
  const [billingModel, setBillingModel] = useState<"none" | "campaign" | "lead" | "both">("none");
  const [contactId, setContactId] = useState("none");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setStage("novo_lead");
      setPotentialValue("");
      setExpectedCloseAt("");
      setBillingModel("none");
      setContactId("none");
    }
  }, [open]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/partners/${partnerId}/opportunities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          stage,
          potentialValue: potentialValue ? Number(potentialValue) : undefined,
          expectedCloseAt: expectedCloseAt || undefined,
          billingModel: billingModel !== "none" ? billingModel : undefined,
          contactId: contactId !== "none" ? contactId : undefined,
        }),
      });
      if (res.ok) {
        onSaved();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Erro ao salvar");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova oportunidade</DialogTitle>
          <DialogDescription>Crie um negócio no pipeline.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Título *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 text-sm" />
          </div>
          <div>
            <Label className="text-xs">Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="mt-1 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Estágio</Label>
              <Select value={stage} onValueChange={(v) => setStage(v as PartnerStage)}>
                <SelectTrigger className="mt-1 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STAGE_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Valor potencial (R$)</Label>
              <Input
                type="number"
                value={potentialValue}
                onChange={(e) => setPotentialValue(e.target.value)}
                className="mt-1 text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Fechamento previsto</Label>
              <Input
                type="date"
                value={expectedCloseAt}
                onChange={(e) => setExpectedCloseAt(e.target.value)}
                className="mt-1 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Cobrança</Label>
              <Select value={billingModel} onValueChange={(v) => setBillingModel(v as typeof billingModel)}>
                <SelectTrigger className="mt-1 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  <SelectItem value="campaign">Por campanha</SelectItem>
                  <SelectItem value="lead">Por lead</SelectItem>
                  <SelectItem value="both">Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {contacts.length > 0 && (
            <div>
              <Label className="text-xs">Contato principal</Label>
              <Select value={contactId} onValueChange={setContactId}>
                <SelectTrigger className="mt-1 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {contacts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

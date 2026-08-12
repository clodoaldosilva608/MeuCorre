"use client";

import { useEffect, useState } from "react";
import { BarChart3, Loader2, AlertCircle, FileText, Bell } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DashboardView } from "@/components/admin/metricas/dashboard-view";
import { AlertsView } from "@/components/admin/metricas/alerts-view";
import { ReportsView } from "@/components/admin/metricas/reports-view";

export default function MetricasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-zinc-100">
          <BarChart3 className="h-6 w-6 text-emerald-400" />
          Métricas e Relatórios
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Dashboard executivo com KPIs de negócio, alertas inteligentes e relatórios exportáveis.
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-3 sm:w-auto">
          <TabsTrigger value="dashboard" className="gap-1.5 text-xs">
            <BarChart3 className="h-3.5 w-3.5" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-1.5 text-xs">
            <Bell className="h-3.5 w-3.5" />
            Alertas
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-1.5 text-xs">
            <FileText className="h-3.5 w-3.5" />
            Relatórios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-4">
          <DashboardView />
        </TabsContent>

        <TabsContent value="alerts" className="mt-4">
          <AlertsView />
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          <ReportsView />
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Users, TrendingUp, AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "@/components/KPICard";
import { WorkerListTable } from "@/components/workers/WorkerListTable";
import { CreateWorkerModal, EditWorkerModal, DeleteConfirmModal } from "@/components/workers/WorkerModals";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkers } from "@/hooks/useWorkers";
import { Worker, WorkerCreatePayload, WorkerUpdatePayload } from "@/lib/workers-api";

export default function WorkersPage() {
  const { user } = useAuth();
  const { workers, isLoading, error, addWorker, bulkAddWorkers, resetWorkers, updateWorkerRecord, removeWorker } = useWorkers();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "risk" | "fatigue">("risk");

  const highRiskCount = workers.filter((w) => w.risk_score > 60).length;
  const avgFatigue = workers.length > 0 ? Math.round(workers.reduce((s, w) => s + w.fatigue_level, 0) / workers.length) : 0;
  const avgRisk = workers.length > 0 ? Math.round(workers.reduce((s, w) => s + w.risk_score, 0) / workers.length) : 0;
  const canManageWorkers = user?.role === "admin" || user?.role === "manager";

  const filteredWorkers = useMemo(() => {
    const filtered = workers.filter((worker) => {
      const matchesSearch =
        search.trim().length === 0 ||
        worker.name.toLowerCase().includes(search.toLowerCase()) ||
        worker.role.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === "all" || worker.role.toLowerCase() === roleFilter;
      const matchesStatus = statusFilter === "all" || worker.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });

    return filtered.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "fatigue") {
        return b.fatigue_level - a.fatigue_level;
      }
      return b.risk_score - a.risk_score;
    });
  }, [workers, search, roleFilter, statusFilter, sortBy]);

  const roleOptions = useMemo(() => {
    return Array.from(new Set(workers.map((w) => w.role.toLowerCase()))).sort();
  }, [workers]);

  const handleBulkAdd = async () => {
    const seedWorkers: WorkerCreatePayload[] = [
      { name: "Bulk Worker 1", role: "helper", fatigue_level: 12, position: { x: 10, y: 20 }, status: "active" },
      { name: "Bulk Worker 2", role: "welder", fatigue_level: 28, position: { x: 40, y: 35 }, status: "active" },
      { name: "Bulk Worker 3", role: "rigger", fatigue_level: 36, position: { x: 65, y: 55 }, status: "on_break" },
    ];
    await bulkAddWorkers(seedWorkers);
  };

  const handleResetWorkers = async () => {
    await resetWorkers();
  };

  const handleCreateClick = () => {
    setSelectedWorker(null);
    setShowCreateModal(true);
    setSubmitError(null);
  };

  const handleEditClick = (worker: Worker) => {
    setSelectedWorker(worker);
    setShowEditModal(true);
    setSubmitError(null);
  };

  const handleDeleteClick = (worker: Worker) => {
    setSelectedWorker(worker);
    setShowDeleteModal(true);
    setSubmitError(null);
  };

  const handleCreateSubmit = async (payload: WorkerCreatePayload) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await addWorker(payload);
      setShowCreateModal(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to create worker");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (payload: WorkerUpdatePayload) => {
    if (!selectedWorker) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await updateWorkerRecord(selectedWorker.id, payload);
      setShowEditModal(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to update worker");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedWorker) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await removeWorker(selectedWorker.id);
      setShowDeleteModal(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to delete worker");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Worker Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage and monitor construction site workers</p>
        </div>
        <div className="flex items-center gap-2">
          {canManageWorkers && (
            <>
              <Button onClick={handleBulkAdd} variant="secondary" className="gap-2">
                <Users className="w-4 h-4" />
                Bulk Add
              </Button>
              <Button onClick={handleResetWorkers} variant="outline" className="gap-2 text-destructive border-destructive/30 hover:text-destructive">
                <RotateCcw className="w-4 h-4" />
                Reset Workers
              </Button>
              <Button onClick={handleCreateClick} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Worker
              </Button>
            </>
          )}
        </div>
      </div>

      <Card className="glass rounded-lg border-border/20">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or role"
              className="h-10 rounded-md border border-border/30 bg-card px-3 text-sm"
            />
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="h-10 rounded-md border border-border/30 bg-card px-3 text-sm">
              <option value="all">All roles</option>
              {roleOptions.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 rounded-md border border-border/30 bg-card px-3 text-sm">
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on_break">On Break</option>
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as "name" | "risk" | "fatigue")} className="h-10 rounded-md border border-border/30 bg-card px-3 text-sm">
              <option value="risk">Sort by Risk</option>
              <option value="fatigue">Sort by Fatigue</option>
              <option value="name">Sort by Name</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Workers" value={workers.length} icon={<Users className="w-4 h-4" />} color="primary" subtitle="On site" />
        <KPICard title="High Risk" value={highRiskCount} icon={<AlertTriangle className="w-4 h-4" />} color="destructive" subtitle="Requires attention" />
        <KPICard title="Avg Fatigue" value={`${avgFatigue}%`} icon={<TrendingUp className="w-4 h-4" />} color="warning" subtitle="Crew average" />
        <KPICard title="Avg Risk" value={`${avgRisk}%`} icon={<TrendingUp className="w-4 h-4" />} color="primary" subtitle="Risk score" />
      </div>

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
        >
          Failed to load workers: {error}
        </motion.div>
      )}

      {/* Worker Table */}
      <Card className="glass rounded-lg border-border/20">
        <CardHeader>
          <CardTitle>Workers Directory</CardTitle>
          <CardDescription>View and manage all workers on site</CardDescription>
        </CardHeader>
        <CardContent>
          <WorkerListTable
            workers={filteredWorkers}
            isLoading={isLoading}
            canManage={canManageWorkers}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
          />
        </CardContent>
      </Card>

      {/* Modals */}
      {canManageWorkers && (
        <>
          <CreateWorkerModal
            isOpen={showCreateModal}
            isSubmitting={isSubmitting}
            error={submitError}
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateSubmit}
          />

          <EditWorkerModal
            isOpen={showEditModal}
            worker={selectedWorker}
            isSubmitting={isSubmitting}
            error={submitError}
            onClose={() => setShowEditModal(false)}
            onSubmit={handleEditSubmit}
          />

          <DeleteConfirmModal
            isOpen={showDeleteModal}
            worker={selectedWorker}
            isDeleting={isSubmitting}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={handleDeleteConfirm}
          />
        </>
      )}
    </motion.div>
  );
}

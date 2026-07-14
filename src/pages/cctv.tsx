import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Camera,
  CircleDot,
  HardDrive,
  MapPin,
  Plus,
  Radio,
  Server,
  Video,
  Wifi,
  WifiOff,
} from "lucide-react";

import type { CctvCamera, Nvr } from "@/types";
import { PageHeader } from "@/components/shared/page-header";
import { MiniStat } from "@/components/shared/mini-stat";
import { SearchInput } from "@/components/shared/search-input";
import { FilterSelect } from "@/components/shared/filter-select";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { DetailSheet } from "@/components/shared/detail-sheet";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAsync } from "@/hooks/use-async";
import { cctvService, nvrService } from "@/services";
import { CCTV_ZONE_OPTIONS } from "@/config/constants";
import { formatDate, formatRelativeTime } from "@/lib/format";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { CameraFormDialog } from "@/components/forms/camera-form-dialog";
import { NvrFormDialog } from "@/components/forms/nvr-form-dialog";
import { CameraMoveDialog } from "@/components/forms/camera-move-dialog";
import { cameraHistoryService } from "@/services";

const STATUS_OPTIONS = [
  { label: "Online", value: "online" },
  { label: "Recording", value: "recording" },
  { label: "Offline", value: "offline" },
  { label: "Maintenance", value: "maintenance" },
];

function CameraTile({
  camera,
  onOpen,
  index,
  nvrName,
}: {
  camera: CctvCamera;
  onOpen: (c: CctvCamera) => void;
  index: number;
  nvrName?: string | null;
}) {
  const offline = camera.status === "offline";
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: (index % 8) * 0.04 }}
    >
      <Card
        onClick={() => onOpen(camera)}
        className="group cursor-pointer overflow-hidden transition-shadow hover:shadow-elevated"
      >
        <div className="p-3 space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold leading-tight text-sm">{camera.name}</p>
              <p className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                <MapPin className="h-3 w-3" /> {camera.location}
              </p>
            </div>
            <StatusBadge status={camera.status} />
          </div>

          <div className="space-y-1 pt-1.5 border-t">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="font-mono">{camera.ipAddress}</span>
              <span>{camera.resolution}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="truncate">SN: {camera.serialNumber || "—"}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
              <span className="flex items-center gap-1 truncate pr-2">
                <Server className="h-3 w-3 shrink-0" />
                <span className="truncate">{nvrName ? nvrName : "Standalone"}</span>
              </span>
              {camera.recording && (
                <span className="flex items-center gap-1 text-[10px] font-medium text-destructive shrink-0">
                  <CircleDot className="h-2.5 w-2.5 animate-pulse" /> REC
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export function CctvPage() {
  const { data, loading, refetch } = useAsync(() => cctvService.all(), []);
  const nvrsQ = useAsync(() => nvrService.all(), []);
  const nvrsMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const n of nvrsQ.data ?? []) map.set(n.id, n.name);
    return map;
  }, [nvrsQ.data]);
  const [search, setSearch] = useState("");
  const [zone, setZone] = useState("");
  const [status, setStatus] = useState("");
  const [nvrFilter, setNvrFilter] = useState("");
  const [detail, setDetail] = useState<CctvCamera | null>(null);
  const [open, setOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [editingCamera, setEditingCamera] = useState<CctvCamera | null>(null);
  const [installStatus, setInstallStatus] = useState("installed");

  const historyQ = useAsync(() => cameraHistoryService.all(), [open]);

  const cameras = data ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cameras.filter(
      (c) =>
        (!q ||
          [c.name, c.location, c.zone, c.ipAddress, c.model]
            .join(" ")
            .toLowerCase()
            .includes(q)) &&
        (!zone || c.zone === zone) &&
        (!status || c.status === status) &&
        (!nvrFilter || c.nvrId === nvrFilter) &&
        (c.installationStatus === installStatus),
    );
  }, [cameras, search, zone, status, nvrFilter, installStatus]);

  const stats = useMemo(
    () => ({
      online: cameras.filter((c) => c.status !== "offline" && c.installationStatus === "installed").length,
      offline: cameras.filter((c) => c.status === "offline" && c.installationStatus === "installed").length,
      recording: cameras.filter((c) => c.recording && c.installationStatus === "installed").length,
    }),
    [cameras],
  );

  const openCamera = (c: CctvCamera) => {
    setDetail(c);
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="CCTV Management"
        description="Monitor the camera fleet, recording status and storage health."
        icon={<Camera className="h-5 w-5" />}
      >
        <Button onClick={() => { setEditingCamera(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4" /> Add Camera
        </Button>
      </PageHeader>

      <Tabs defaultValue="cameras" className="space-y-6">
        <TabsList>
          <TabsTrigger value="cameras">
            <Camera className="h-4 w-4" /> Cameras
          </TabsTrigger>
          <TabsTrigger value="recorders">
            <Server className="h-4 w-4" /> Recorders (NVR)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cameras" className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Online (Installed)" value={stats.online} tone="success" icon={<Wifi className="h-5 w-5" />} loading={loading} />
        <MiniStat label="Offline (Installed)" value={stats.offline} tone="destructive" icon={<WifiOff className="h-5 w-5" />} loading={loading} />
        <MiniStat label="Recording" value={stats.recording} tone="info" icon={<Radio className="h-5 w-5" />} loading={loading} />
      </div>

      <div className="flex gap-2 border-b pb-4">
        <Button 
          variant={installStatus === "installed" ? "default" : "outline"} 
          onClick={() => setInstallStatus("installed")}
        >
          Installed Cameras
        </Button>
        <Button 
          variant={installStatus === "inventory" ? "default" : "outline"} 
          onClick={() => setInstallStatus("inventory")}
        >
          Inventory / Spares
        </Button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search cameras, zones, IPs..."
          className="w-full sm:w-72"
        />
        <FilterSelect value={zone} onChange={setZone} options={[...CCTV_ZONE_OPTIONS]} allLabel="All zones" />
        <FilterSelect value={status} onChange={setStatus} options={STATUS_OPTIONS} allLabel="All statuses" />
        <FilterSelect value={nvrFilter} onChange={setNvrFilter} options={Array.from(nvrsMap.entries()).map(([value, label]) => ({ value, label }))} allLabel="All NVRs" />
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-28 w-full rounded-none" />
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Camera}
          title="No cameras found"
          description="Adjust your filters or add a new camera to the fleet."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((camera, i) => (
            <CameraTile key={camera.id} camera={camera} onOpen={openCamera} index={i} nvrName={camera.nvrId ? nvrsMap.get(camera.nvrId) : null} />
          ))}
        </div>
      )}
        </TabsContent>

        <TabsContent value="recorders">
          <NvrPanel />
        </TabsContent>
      </Tabs>

      <CameraFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        camera={editingCamera}
        onCreated={refetch}
      />

      <DetailSheet
        open={open}
        onOpenChange={setOpen}
        headerBadge={detail && <StatusBadge status={detail.status} />}
        title={detail?.name ?? ""}
        subtitle={detail ? `${detail.model} · ${detail.resolution}` : ""}
        sections={
          detail
            ? [
                {
                  title: "Network",
                  rows: [
                    { label: "IP address", value: <span className="font-mono">{detail.ipAddress}</span> },
                    { label: "Firmware", value: detail.firmwareVersion },
                    { label: "Last ping", value: formatRelativeTime(detail.lastPing) },
                  ],
                },
                {
                  title: "Hardware & Location",
                  rows: [
                    { label: "Location", value: detail.location },
                    { label: "Zone", value: detail.zone },
                    { label: "Status", value: <span className="capitalize font-medium">{detail.installationStatus}</span> },
                    { label: "Recording", value: detail.recording ? "Yes" : "No" },
                    { label: "Connected NVR", value: detail.nvrId ? (nvrsMap.get(detail.nvrId) || detail.nvrId) : "Standalone" },
                    { label: "Serial Number", value: detail.serialNumber || "—" },
                    { label: "Installed", value: formatDate(detail.installedDate) },
                  ],
                },
                ...(historyQ.data?.filter(h => h.cameraId === detail.id).length ? [{
                  title: "History Timeline",
                  rows: historyQ.data.filter(h => h.cameraId === detail.id).map(h => ({
                    label: formatDate(h.date),
                    value: (
                      <div className="text-right">
                        <p className="font-medium">{h.action}</p>
                        {h.notes && <p className="text-xs text-muted-foreground">{h.notes}</p>}
                      </div>
                    )
                  }))
                }] : []),
              ]
            : []
        }
        footer={
          detail && (
            <>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Close
              </Button>
              <Button variant="outline" onClick={() => { setMoveOpen(true); setOpen(false); }}>
                Move / Change Status
              </Button>
              <Button variant="outline" onClick={() => { setEditingCamera(detail); setFormOpen(true); setOpen(false); }}>
                Edit
              </Button>
              <Button variant="destructive" onClick={async () => {
                if (confirm("Are you sure you want to delete this camera?")) {
                  try {
                    await cctvService.remove(detail.id);
                    toast.success("Camera deleted successfully");
                    setOpen(false);
                    refetch();
                  } catch (e: any) {
                    toast.error("Failed to delete camera: " + e.message);
                  }
                }
              }}>
                Delete
              </Button>
              <Button onClick={() => toast.success(`Opening live feed for ${detail.name} (demo)`)}>
                <Radio className="h-4 w-4" /> Live feed
              </Button>
            </>
          )
        }
      />
      
      <CameraMoveDialog
        open={moveOpen}
        onOpenChange={setMoveOpen}
        camera={detail}
        onUpdated={refetch}
      />
    </div>
  );
}


function NvrTile({
  nvr,
  onOpen,
  index,
}: {
  nvr: Nvr;
  onOpen: (n: Nvr) => void;
  index: number;
}) {
  const channelPct = Math.round((nvr.channelsUsed / nvr.channelsTotal) * 100);
  const storagePct = Math.round((nvr.storageUsedTb / nvr.storageTotalTb) * 100);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: (index % 6) * 0.05 }}
    >
      <Card
        onClick={() => onOpen(nvr)}
        className="group cursor-pointer p-5 transition-shadow hover:shadow-elevated"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Server className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold">{nvr.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {nvr.manufacturer} · {nvr.model}
              </p>
            </div>
          </div>
          <StatusBadge status={nvr.status} />
        </div>

        <div className="mt-4 space-y-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Video className="h-3 w-3" /> Channels
              </span>
              <span>
                {nvr.channelsUsed} / {nvr.channelsTotal}
              </span>
            </div>
            <Progress
              value={channelPct}
              className="h-1.5"
              indicatorClassName={channelPct > 90 ? "bg-warning" : "bg-primary"}
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <HardDrive className="h-3 w-3" /> Storage
              </span>
              <span>
                {nvr.storageUsedTb} / {nvr.storageTotalTb} TB
              </span>
            </div>
            <Progress
              value={storagePct}
              className="h-1.5"
              indicatorClassName={
                storagePct > 85
                  ? "bg-destructive"
                  : storagePct > 65
                    ? "bg-warning"
                    : "bg-success"
              }
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {nvr.location}
          </span>
          {nvr.hddHealth && (
            <span className={`capitalize ${nvr.hddHealth === 'critical' ? 'text-destructive font-medium' : nvr.hddHealth === 'warning' ? 'text-warning font-medium' : 'text-success'}`}>
              HDD: {nvr.hddHealth}
            </span>
          )}
          <span className="font-mono">{nvr.ipAddress}</span>
        </div>
      </Card>
    </motion.div>
  );
}

function NvrPanel() {
  const { data, loading, refetch } = useAsync(() => nvrService.all(), []);
  const camerasQ = useAsync(() => cctvService.all(), []);
  const [detail, setDetail] = useState<Nvr | null>(null);
  const [open, setOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingNvr, setEditingNvr] = useState<Nvr | null>(null);

  const nvrs = data ?? [];

  const cameraMap = useMemo(() => {
    const map = new Map<string, CctvCamera>();
    for (const c of camerasQ.data ?? []) map.set(c.id, c);
    return map;
  }, [camerasQ.data]);

  const stats = useMemo(
    () => ({
      total: nvrs.length,
      online: nvrs.filter((n) => n.status === "online").length,
      channels: nvrs.reduce((s, n) => s + n.channelsUsed, 0),
      storage: Math.round(
        (nvrs.reduce((s, n) => s + n.storageUsedTb, 0) /
          Math.max(nvrs.reduce((s, n) => s + n.storageTotalTb, 0), 1)) *
          100,
      ),
    }),
    [nvrs],
  );

  let parsedIds: string[] = [];
  if (detail) {
    if (Array.isArray(detail.connectedCameraIds)) {
      parsedIds = detail.connectedCameraIds;
    } else if (typeof detail.connectedCameraIds === "string") {
      try {
        parsedIds = JSON.parse(detail.connectedCameraIds);
      } catch (e) {
        parsedIds = [];
      }
    }
  }

  const connectedCameras = parsedIds
    .map((id) => cameraMap.get(id))
    .filter((c): c is CctvCamera => Boolean(c));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Network Video Recorders</h3>
        <Button onClick={() => { setEditingNvr(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4" /> Add Recorder
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Recorders" value={stats.total} icon={<Server className="h-5 w-5" />} loading={loading} />
        <MiniStat label="Online" value={stats.online} tone="success" icon={<Wifi className="h-5 w-5" />} loading={loading} />
        <MiniStat label="Channels in use" value={stats.channels} tone="info" icon={<Video className="h-5 w-5" />} loading={loading} />
        <MiniStat label="Storage used" value={`${stats.storage}%`} tone="warning" icon={<HardDrive className="h-5 w-5" />} loading={loading} />
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="p-5">
              <Skeleton className="h-11 w-11 rounded-xl" />
              <Skeleton className="mt-3 h-4 w-2/3" />
              <Skeleton className="mt-4 h-1.5 w-full" />
              <Skeleton className="mt-3 h-1.5 w-full" />
            </Card>
          ))}
        </div>
      ) : nvrs.length === 0 ? (
        <EmptyState icon={Server} title="No recorders" description="No NVR devices have been registered." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {nvrs.map((nvr, i) => (
            <NvrTile
              key={nvr.id}
              nvr={nvr}
              index={i}
              onOpen={(n) => {
                setDetail(n);
                setOpen(true);
              }}
            />
          ))}
        </div>
      )}

      <DetailSheet
        open={open}
        onOpenChange={setOpen}
        headerBadge={detail && <StatusBadge status={detail.status} />}
        title={detail?.name ?? ""}
        subtitle={detail ? `${detail.manufacturer} · ${detail.model}` : ""}
        sections={
          detail
            ? [
                {
                  title: "Network",
                  rows: [
                    { label: "IP address", value: <span className="font-mono">{detail.ipAddress}</span> },
                    { label: "MAC Address", value: <span className="font-mono">{detail.macAddress || "—"}</span> },
                    { label: "Serial No", value: detail.serialNumber || "—" },
                    { label: "Firmware", value: detail.firmwareVersion },
                    { label: "Installed", value: formatDate(detail.installedDate) },
                  ],
                },
                {
                  title: "Capacity",
                  rows: [
                    {
                      label: "Channels",
                      value: `${detail.channelsUsed} / ${detail.channelsTotal}`,
                    },
                    {
                      label: "Storage",
                      value: `${detail.storageUsedTb} / ${detail.storageTotalTb} TB`,
                    },
                    { label: "HDD Health", value: <span className="capitalize">{detail.hddHealth || "Unknown"}</span> },
                    { label: "SMART Test", value: <span className="capitalize">{detail.smartTestStatus || "—"}</span> },
                    { label: "Retention", value: `${detail.recordingRetentionDays} days` },
                    { label: "Location", value: detail.location },
                  ],
                },
                ...(detail.supportedEvents || detail.alerts ? [
                  {
                    title: "Monitoring",
                    rows: [
                      ...(detail.alerts && detail.alerts.length > 0 ? [{ label: "Active Alerts", value: <span className="text-destructive font-medium">{detail.alerts.join(", ")}</span> }] : []),
                      ...(detail.supportedEvents && detail.supportedEvents.length > 0 ? [{ label: "Supported Events", value: detail.supportedEvents.join(", ") }] : []),
                    ],
                  }
                ] : []),
                {
                  title: `Connected cameras (${connectedCameras.length})`,
                  rows: connectedCameras.length
                    ? connectedCameras.map((c) => ({
                        label: (
                          <span className="flex items-center gap-2">
                            <Camera className="h-3.5 w-3.5 text-muted-foreground" />
                            {c.name}
                          </span>
                        ),
                        value: (
                          <span className="flex items-center justify-end gap-2">
                            <span className="max-w-[130px] truncate text-muted-foreground">
                              {c.zone}
                            </span>
                            <StatusBadge status={c.status} withDot={false} />
                          </span>
                        ),
                      }))
                    : [
                        {
                          label: "—",
                          value: (
                            <span className="text-muted-foreground">No cameras connected</span>
                          ),
                        },
                      ],
                },
              ]
            : []
        }
        footer={
          detail && (
            <>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Close
              </Button>
              <Button variant="outline" onClick={() => { setEditingNvr(detail); setFormOpen(true); setOpen(false); }}>
                Edit
              </Button>
              <Button variant="destructive" onClick={async () => {
                if (confirm("Are you sure you want to delete this NVR?")) {
                  try {
                    await nvrService.remove(detail.id);
                    toast.success("NVR deleted successfully");
                    setOpen(false);
                    refetch();
                  } catch (e: any) {
                    toast.error("Failed to delete NVR: " + e.message);
                  }
                }
              }}>
                Delete
              </Button>
              <Button onClick={() => toast.success(`Opening ${detail.name} console (demo)`)}>
                <Server className="h-4 w-4" /> Manage
              </Button>
            </>
          )
        }
      />
      <NvrFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        nvr={editingNvr}
        onCreated={refetch}
      />
    </div>
  );
}

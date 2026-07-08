import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Camera,
  CircleDot,
  HardDrive,
  MapPin,
  Plus,
  Radio,
  Wifi,
  WifiOff,
} from "lucide-react";

import type { CctvCamera } from "@/types";
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
import { useAsync } from "@/hooks/use-async";
import { cctvService } from "@/services";
import { CCTV_ZONE_OPTIONS } from "@/data/cctv";
import { formatDate, formatRelativeTime } from "@/lib/format";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

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
}: {
  camera: CctvCamera;
  onOpen: (c: CctvCamera) => void;
  index: number;
}) {
  const offline = camera.status === "offline";
  const storagePct = Math.round(
    (camera.storageUsedGb / camera.storageTotalGb) * 100,
  );
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
        {/* Faux video preview */}
        <div
          className={cn(
            "relative flex h-36 items-center justify-center overflow-hidden bg-gradient-to-br",
            offline
              ? "from-muted to-muted/60"
              : "from-slate-800 to-slate-950",
          )}
        >
          <div className="absolute inset-0 bg-grid-pattern bg-[length:20px_20px] opacity-20" />
          {offline ? (
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <WifiOff className="h-7 w-7" />
              <span className="text-xs font-medium">No signal</span>
            </div>
          ) : (
            <Camera className="h-9 w-9 text-white/30 transition-transform group-hover:scale-110" />
          )}

          <div className="absolute left-2.5 top-2.5">
            <StatusBadge status={camera.status} />
          </div>
          {camera.recording && (
            <div className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur">
              <CircleDot className="h-3 w-3 animate-pulse text-destructive" /> REC
            </div>
          )}
          <div className="absolute bottom-2.5 left-2.5 rounded bg-black/50 px-1.5 py-0.5 font-mono text-[10px] text-white backdrop-blur">
            {camera.resolution}
          </div>
        </div>

        <div className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-semibold">{camera.name}</p>
              <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" /> {camera.location}
              </p>
            </div>
            <span className="font-mono text-[10px] text-muted-foreground">
              {camera.ipAddress}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <HardDrive className="h-3 w-3" /> Storage
              </span>
              <span>
                {camera.storageUsedGb} / {camera.storageTotalGb} GB
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
      </Card>
    </motion.div>
  );
}

export function CctvPage() {
  const { data, loading } = useAsync(() => cctvService.all(), []);
  const [search, setSearch] = useState("");
  const [zone, setZone] = useState("");
  const [status, setStatus] = useState("");
  const [detail, setDetail] = useState<CctvCamera | null>(null);
  const [open, setOpen] = useState(false);

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
        (!status || c.status === status),
    );
  }, [cameras, search, zone, status]);

  const stats = useMemo(
    () => ({
      online: cameras.filter((c) => c.status !== "offline").length,
      offline: cameras.filter((c) => c.status === "offline").length,
      recording: cameras.filter((c) => c.recording).length,
      storage: Math.round(
        (cameras.reduce((s, c) => s + c.storageUsedGb, 0) /
          Math.max(cameras.reduce((s, c) => s + c.storageTotalGb, 0), 1)) *
          100,
      ),
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
        <Button onClick={() => toast.info("Add camera form (demo)")}>
          <Plus className="h-4 w-4" /> Add Camera
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Online" value={stats.online} tone="success" icon={<Wifi className="h-5 w-5" />} loading={loading} />
        <MiniStat label="Offline" value={stats.offline} tone="destructive" icon={<WifiOff className="h-5 w-5" />} loading={loading} />
        <MiniStat label="Recording" value={stats.recording} tone="info" icon={<Radio className="h-5 w-5" />} loading={loading} />
        <MiniStat label="Storage used" value={`${stats.storage}%`} tone="warning" icon={<HardDrive className="h-5 w-5" />} loading={loading} />
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
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-36 w-full rounded-none" />
              <div className="space-y-3 p-4">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-1.5 w-full" />
              </div>
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
            <CameraTile key={camera.id} camera={camera} onOpen={openCamera} index={i} />
          ))}
        </div>
      )}

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
                  title: "Location & storage",
                  rows: [
                    { label: "Location", value: detail.location },
                    { label: "Zone", value: detail.zone },
                    { label: "Recording", value: detail.recording ? "Yes" : "No" },
                    {
                      label: "Storage",
                      value: `${detail.storageUsedGb} / ${detail.storageTotalGb} GB`,
                    },
                    { label: "Installed", value: formatDate(detail.installedDate) },
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
              <Button onClick={() => toast.success(`Opening live feed for ${detail.name} (demo)`)}>
                <Radio className="h-4 w-4" /> Live feed
              </Button>
            </>
          )
        }
      />
    </div>
  );
}

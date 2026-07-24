import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Book,
  ChevronDown,
  CircleHelp,
  LifeBuoy,
  Mail,
  MessageSquare,
  Rocket,
  Video,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/sonner";

const CATEGORIES = [
  { icon: Rocket, title: "Getting Started", desc: "Set up your workspace and import assets.", count: 12 },
  { icon: Book, title: "Asset Management", desc: "Track, assign and audit hardware.", count: 24 },
  { icon: Video, title: "Video Tutorials", desc: "Watch step-by-step walkthroughs.", count: 8 },
  { icon: LifeBuoy, title: "Troubleshooting", desc: "Resolve common issues quickly.", count: 16 },
];

const FAQS = [
  {
    q: "How do I add a new asset to the inventory?",
    a: "Navigate to Asset Management and click the “Add Asset” button. Fill in the required details such as asset tag, category and status, then save. The asset will immediately appear in your inventory.",
  },
  {
    q: "How are low-stock alerts triggered?",
    a: "Each inventory item has a reorder level. When the quantity on hand drops to or below that threshold, the item is flagged as low-stock and a notification is generated automatically.",
  },
  {
    q: "Can I assign a device to a team member?",
    a: "Yes. Open any available asset, choose “Edit” and select an assignee, or use the Device Issue & Returns module to formally check a device out with a due date.",
  },
  {
    q: "How do maintenance schedules work?",
    a: "Maintenance tasks can be preventive, corrective or inspection-based. Schedule a task with a date and technician; overdue tasks are highlighted so nothing slips through the cracks.",
  },
  {
    q: "How do I export reports?",
    a: "Go to Reports & Analytics and use the Export button in the top-right. You can export the current view as CSV or generate a detailed financial report as XLSX.",
  },
  {
    q: "What do the camera storage indicators mean?",
    a: "Each CCTV camera shows storage usage. Green is healthy, amber means storage is filling up (over 65%), and red indicates it is nearly full (over 85%) and may need attention.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b last:border-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
      >
        <span className="font-medium">{q}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="pb-4 text-sm text-muted-foreground">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function HelpPage() {
  const [search, setSearch] = useState("");
  const filtered = FAQS.filter(
    (f) =>
      !search ||
      `${f.q} ${f.a}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Help Center"
        description="Guides, FAQs and support to help you get the most out of AssetFlow."
        icon={<CircleHelp className="h-5 w-5" />}
        tone="teal"
      />

      {/* Hero search */}
      <Card className="overflow-hidden">
        <div className="relative bg-gradient-to-br from-primary/10 via-info/5 to-transparent p-8 text-center">
          <div className="pointer-events-none absolute inset-0 bg-grid-pattern bg-[length:22px_22px] opacity-[0.15]" />
          <div className="relative mx-auto max-w-xl space-y-3">
            <h2 className="text-xl font-bold">How can we help you?</h2>
            <p className="text-sm text-muted-foreground">
              Search our knowledge base or browse the categories below.
            </p>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search for answers..."
              className="mx-auto max-w-md"
            />
          </div>
        </div>
      </Card>

      {/* Categories */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {CATEGORIES.map(({ icon: Icon, title, desc, count }) => (
          <Card
            key={title}
            className="group cursor-pointer p-5 transition-shadow hover:shadow-elevated"
            onClick={() =>
              toast.info(`${title} articles aren't published yet — check back soon.`)
            }
          >
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <Icon className="h-5 w-5" />
            </div>
            <p className="font-semibold">{title}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{desc}</p>
            <p className="mt-3 text-xs font-medium text-primary">
              {count} articles
            </p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* FAQ */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
            <CardDescription>
              {filtered.length} {filtered.length === 1 ? "result" : "results"}
              {search && ` for “${search}”`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No articles match your search.
              </p>
            ) : (
              filtered.map((f) => <FaqItem key={f.q} {...f} />)
            )}
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Still need help?</CardTitle>
            <CardDescription>Our support team is here for you.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => toast.info("Live chat isn't available yet — please email support instead.")}
            >
              <MessageSquare className="h-4 w-4" /> Start live chat
            </Button>
            <Button className="w-full justify-start" variant="outline" asChild>
              <a href="mailto:it-support@acme.io">
                <Mail className="h-4 w-4" /> Email support
              </a>
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => toast.info("Documentation site isn't published yet — check back soon.")}
            >
              <Book className="h-4 w-4" /> Browse documentation
            </Button>
            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              Average response time: <span className="font-medium text-foreground">under 2 hours</span> during business hours.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

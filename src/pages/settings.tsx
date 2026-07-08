import { useState } from "react";
import { Monitor, Moon, Settings as SettingsIcon, Sun } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme, type Theme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/sonner";

function SettingRow({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [notif, setNotif] = useState({
    email: true,
    push: true,
    lowStock: true,
    maintenance: true,
    security: true,
    weekly: false,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your organization and application preferences."
        icon={<SettingsIcon className="h-5 w-5" />}
      />

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* General */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Organization</CardTitle>
              <CardDescription>
                Details used across reports and exports.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Organization name</Label>
                  <Input defaultValue="Acme Corporation" />
                </div>
                <div className="space-y-1.5">
                  <Label>Support email</Label>
                  <Input defaultValue="it-support@acme.io" type="email" />
                </div>
                <div className="space-y-1.5">
                  <Label>Default currency</Label>
                  <Select defaultValue="USD">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Timezone</Label>
                  <Select defaultValue="pst">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pst">Pacific (PST)</SelectItem>
                      <SelectItem value="est">Eastern (EST)</SelectItem>
                      <SelectItem value="gmt">London (GMT)</SelectItem>
                      <SelectItem value="cet">Central Europe (CET)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button onClick={() => toast.success("Settings saved")}>
                  Save changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize how AssetFlow looks on your device.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label>Theme</Label>
                <div className="grid max-w-lg grid-cols-3 gap-3">
                  {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => setTheme(value)}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-sm transition-all hover:border-primary/50",
                        theme === value
                          ? "border-primary bg-primary/5"
                          : "border-border",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <Separator />
              <SettingRow
                title="Compact mode"
                description="Reduce spacing to fit more content on screen."
              >
                <Switch onCheckedChange={() => toast.info("Compact mode (demo)")} />
              </SettingRow>
              <SettingRow
                title="Reduce motion"
                description="Minimize animations and transitions."
              >
                <Switch onCheckedChange={() => toast.info("Motion preference (demo)")} />
              </SettingRow>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose which alerts you want to receive.
              </CardDescription>
            </CardHeader>
            <CardContent className="divide-y">
              <SettingRow title="Email notifications" description="Receive updates via email.">
                <Switch checked={notif.email} onCheckedChange={(v) => setNotif((s) => ({ ...s, email: v }))} />
              </SettingRow>
              <SettingRow title="Push notifications" description="In-app real-time alerts.">
                <Switch checked={notif.push} onCheckedChange={(v) => setNotif((s) => ({ ...s, push: v }))} />
              </SettingRow>
              <SettingRow title="Low stock alerts" description="When inventory drops below reorder level.">
                <Switch checked={notif.lowStock} onCheckedChange={(v) => setNotif((s) => ({ ...s, lowStock: v }))} />
              </SettingRow>
              <SettingRow title="Maintenance reminders" description="Upcoming and overdue maintenance.">
                <Switch checked={notif.maintenance} onCheckedChange={(v) => setNotif((s) => ({ ...s, maintenance: v }))} />
              </SettingRow>
              <SettingRow title="Security alerts" description="Camera and access-related events.">
                <Switch checked={notif.security} onCheckedChange={(v) => setNotif((s) => ({ ...s, security: v }))} />
              </SettingRow>
              <SettingRow title="Weekly digest" description="A summary of activity every Monday.">
                <Switch checked={notif.weekly} onCheckedChange={(v) => setNotif((s) => ({ ...s, weekly: v }))} />
              </SettingRow>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>
                Protect your account and organization data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Current password</Label>
                  <Input type="password" placeholder="••••••••" />
                </div>
                <div className="space-y-1.5">
                  <Label>New password</Label>
                  <Input type="password" placeholder="••••••••" />
                </div>
              </div>
              <Separator />
              <SettingRow
                title="Two-factor authentication"
                description="Add an extra layer of security to your account."
              >
                <Switch defaultChecked onCheckedChange={() => toast.info("2FA (demo)")} />
              </SettingRow>
              <SettingRow
                title="Session timeout"
                description="Automatically sign out after inactivity."
              >
                <Select defaultValue="30">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 min</SelectItem>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                  </SelectContent>
                </Select>
              </SettingRow>
              <Separator />
              <div className="flex justify-end">
                <Button onClick={() => toast.success("Security settings updated")}>
                  Update security
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { Link } from "react-router-dom";
import { Camera, Mail, MapPin, Phone, ShieldCheck, UserCog } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { ActivityFeed } from "@/components/shared/activity-feed";
import { ListSkeleton } from "@/components/shared/loading";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAsync } from "@/hooks/use-async";
import { notificationService } from "@/services";
import { currentUser } from "@/config/constants";
import { formatDate, getInitials } from "@/lib/format";
import { toast } from "@/components/ui/sonner";

export function ProfilePage() {
  const activity = useAsync(() => notificationService.activity(), []);
  const u = currentUser;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Manage your personal information and preferences."
        icon={<UserCog className="h-5 w-5" />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: identity card */}
        <Card className="h-fit lg:col-span-1">
          <CardContent className="flex flex-col items-center p-6 text-center">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-background shadow-elevated">
                <AvatarFallback className="text-2xl">
                  {getInitials(u.name)}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon-sm"
                className="absolute bottom-0 right-0 rounded-full"
                onClick={() => toast.info("Upload photo (demo)")}
                aria-label="Change photo"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <h2 className="mt-4 text-lg font-semibold">{u.name}</h2>
            <p className="text-sm text-muted-foreground">{u.jobTitle}</p>
            <Badge variant="default" className="mt-2 capitalize">
              <ShieldCheck className="h-3 w-3" /> {u.role}
            </Badge>

            <Separator className="my-5" />

            <div className="w-full space-y-3 text-left text-sm">
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <Mail className="h-4 w-4" /> {u.email}
              </div>
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <Phone className="h-4 w-4" /> {u.phone}
              </div>
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <MapPin className="h-4 w-4" /> {u.location}
              </div>
            </div>

            <Separator className="my-5" />
            <p className="text-xs text-muted-foreground">
              Member since {formatDate(u.createdAt)}
            </p>
          </CardContent>
        </Card>

        {/* Right: editable form + activity */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your account details and contact info.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Full name</Label>
                  <Input defaultValue={u.name} />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" defaultValue={u.email} />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input defaultValue={u.phone} />
                </div>
                <div className="space-y-1.5">
                  <Label>Location</Label>
                  <Input defaultValue={u.location} />
                </div>
                <div className="space-y-1.5">
                  <Label>Department</Label>
                  <Input defaultValue={u.department} />
                </div>
                <div className="space-y-1.5">
                  <Label>Job title</Label>
                  <Input defaultValue={u.jobTitle} />
                </div>
              </div>
              <Separator />
              <div className="flex justify-end gap-2">
                <Button variant="outline" asChild>
                  <Link to="/settings">Account settings</Link>
                </Button>
                <Button onClick={() => toast.success("Profile updated")}>
                  Save changes
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest actions across the platform.</CardDescription>
            </CardHeader>
            <CardContent>
              {activity.loading || !activity.data ? (
                <ListSkeleton rows={5} />
              ) : (
                <ActivityFeed entries={activity.data.slice(0, 6)} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

import type { AssetCondition, DeviceIssue, IssueStatus } from "@/types";
import { chance, dateFromNow, pick, randInt } from "./seed";
import { assets } from "./assets";
import { users } from "./users";

const CONDITIONS: AssetCondition[] = ["new", "good", "good", "fair"];

export const deviceIssues: DeviceIssue[] = Array.from({ length: 38 }).map(
  (_, i) => {
    const asset = pick(assets);
    const user = pick(users);
    const issuedDays = randInt(1, 180);
    const dueDays = issuedDays - randInt(30, 120);
    const returned = chance(0.45);
    const isOverdue = !returned && dueDays > 0;

    let status: IssueStatus;
    if (returned) status = "returned";
    else if (isOverdue) status = "overdue";
    else if (chance(0.15)) status = "pending";
    else status = "issued";

    return {
      id: `iss-${(i + 1).toString().padStart(3, "0")}`,
      reference: `ISS-${(2400 + i).toString()}`,
      assetTag: asset.assetTag,
      assetName: asset.name,
      issuedTo: {
        id: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl,
        department: user.department,
      },
      issuedBy: "IT Service Desk",
      issueDate: dateFromNow(-issuedDays),
      dueDate: dateFromNow(-dueDays),
      returnDate: returned ? dateFromNow(-randInt(0, issuedDays)) : null,
      status,
      condition: pick(CONDITIONS),
      notes: undefined,
    } satisfies DeviceIssue;
  },
);

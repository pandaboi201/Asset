import type { User, UserRole } from "@/types";
import { dateFromNow, pick, randInt } from "./seed";

const FIRST_NAMES = [
  "Ava", "Liam", "Sophia", "Noah", "Isabella", "Ethan", "Mia", "Lucas",
  "Amelia", "Mason", "Harper", "Elijah", "Evelyn", "Logan", "Aria", "James",
  "Priya", "Wei", "Fatima", "Diego", "Yuki", "Omar", "Nina", "Kofi",
];
const LAST_NAMES = [
  "Carter", "Reyes", "Nguyen", "Patel", "Kim", "Rossi", "Silva", "Khan",
  "Novak", "Okafor", "Haddad", "Andersson", "Costa", "Tanaka", "Mensah",
  "Ivanov", "Dubois", "Larsson", "Fischer", "Moreau",
];
const DEPARTMENTS = [
  "IT Operations", "Engineering", "Finance", "Human Resources", "Sales",
  "Marketing", "Security", "Facilities", "Support", "Legal",
];
const TITLES = [
  "Systems Administrator", "Software Engineer", "IT Technician",
  "Network Engineer", "Support Specialist", "Security Analyst",
  "Operations Manager", "DevOps Engineer", "Help Desk Agent", "IT Director",
];
const LOCATIONS = [
  "New York HQ", "San Francisco", "London", "Singapore", "Berlin",
  "Toronto", "Austin", "Remote",
];
const ROLES: UserRole[] = ["admin", "manager", "technician", "viewer"];

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z]/g, ".");
}

export const users: User[] = Array.from({ length: 28 }).map((_, i) => {
  const first = pick(FIRST_NAMES);
  const last = pick(LAST_NAMES);
  const name = `${first} ${last}`;
  const role = i < 2 ? "admin" : pick(ROLES);
  return {
    id: `usr-${(i + 1).toString().padStart(3, "0")}`,
    name,
    email: `${slug(first)}.${slug(last)}@acme.io`,
    avatarUrl: undefined,
    role,
    department: pick(DEPARTMENTS),
    jobTitle: pick(TITLES),
    phone: `+1 (${randInt(200, 989)}) ${randInt(200, 989)}-${randInt(1000, 9999)}`,
    location: pick(LOCATIONS),
    status: i % 11 === 0 ? "invited" : i % 17 === 0 ? "suspended" : "active",
    lastActiveAt: dateFromNow(-randInt(0, 20)),
    createdAt: dateFromNow(-randInt(60, 900)),
  } satisfies User;
});

/** The signed-in user for profile / topbar. */
export const currentUser: User = {
  id: "usr-000",
  name: "Jordan Mitchell",
  email: "jordan.mitchell@acme.io",
  role: "admin",
  department: "IT Operations",
  jobTitle: "IT Operations Director",
  phone: "+1 (415) 555-0142",
  location: "San Francisco",
  status: "active",
  lastActiveAt: new Date().toISOString(),
  createdAt: dateFromNow(-1240),
};

export const DEPARTMENT_OPTIONS = DEPARTMENTS;
export const LOCATION_OPTIONS = LOCATIONS;

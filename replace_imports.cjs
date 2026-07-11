const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  "src/components/forms/camera-form-dialog.tsx",
  "src/components/forms/inventory-form-dialog.tsx",
  "src/components/forms/spare-part-form-dialog.tsx",
  "src/components/forms/user-form-dialog.tsx",
  "src/components/layout/notifications-popover.tsx",
  "src/components/layout/user-menu.tsx",
  "src/components/shared/install-part-dialog.tsx",
  "src/pages/assets/asset-form-dialog.tsx",
  "src/pages/assets/index.tsx",
  "src/pages/cctv.tsx",
  "src/pages/inventory.tsx",
  "src/pages/notifications.tsx",
  "src/pages/profile.tsx",
  "src/pages/reports.tsx",
  "src/pages/spare-parts.tsx",
  "src/pages/users.tsx"
];

filesToUpdate.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    // Replace imports from @/data/... with @/config/constants
    content = content.replace(/from "@\/data\/[^"]+"/g, 'from "@/config/constants"');
    
    // Specially handle notification aliases
    content = content.replace(/notifications as seedNotifications/g, 'notifications');
    content = content.replace(/notifications as seed/g, 'notifications');
    
    fs.writeFileSync(fullPath, content);
    console.log("Updated", file);
  } else {
    console.warn("Not found:", file);
  }
});

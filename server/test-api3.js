async function test() {
  const getRes = await fetch("http://localhost:3001/api/nvr");
  const nvrs = await getRes.json();
  if (nvrs.length === 0) {
    console.log("No NVRs found.");
    return;
  }
  
  const nvr = nvrs[0];
  console.log("Original NVR location:", nvr.location);
  
  const newLocation = "Test Location " + Date.now();
  const patchRes = await fetch("http://localhost:3001/api/nvr/" + nvr.id, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ location: newLocation })
  });
  const updatedNvr = await patchRes.json();
  console.log("Updated NVR location from PATCH response:", updatedNvr.location);
  
  const getRes2 = await fetch("http://localhost:3001/api/nvr/" + nvr.id);
  const fetchedNvr = await getRes2.json();
  console.log("Updated NVR location from GET response:", fetchedNvr.location);
}
test().catch(console.error);

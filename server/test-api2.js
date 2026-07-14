async function test() {
  const getRes = await fetch("http://localhost:5000/api/nvr");
  const nvrs = await getRes.json();
  if (nvrs.length === 0) {
    console.log("No NVRs found.");
    return;
  }
  
  const nvr = nvrs[0];
  console.log("Original NVR:", nvr);
  
  const newLocation = "Test Location " + Date.now();
  const patchRes = await fetch("http://localhost:5000/api/nvr/" + nvr.id, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ location: newLocation })
  });
  const updatedNvr = await patchRes.json();
  console.log("Updated NVR:", updatedNvr);
}
test().catch(console.error);

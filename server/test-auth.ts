import fetch from "node-fetch";

async function testBasicAuth() {
  const ip = "192.168.35.13";
  const url = `http://${ip}/ISAPI/System/deviceInfo`;
  // Provide the username and password here for testing
  const username = "admin"; // guess default
  const password = "your_password_here"; // I'll prompt the user

  const encoded = Buffer.from(`${username}:${password}`).toString("base64");
  
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Basic ${encoded}`
      }
    });
    console.log("Status:", res.status);
    console.log(await res.text());
  } catch (e: any) {
    console.error("Error:", e.message);
  }
}
testBasicAuth();

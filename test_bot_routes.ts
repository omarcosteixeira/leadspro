async function check() {
  const url = "https://argoscliente2-production.up.railway.app";
  const r1 = await fetch(`${url}/api/toggle`, { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ botNumber: "1234", active: true, isAutoReplyActive: true }) });
  console.log("toggle:", r1.status, await r1.text());

  const r2 = await fetch(`${url}/api/send`, { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ number: "1234", message: "Hello" }) });
  console.log("send:", r2.status, await r2.text());
}
check();

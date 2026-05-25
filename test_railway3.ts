async function check() {
  const url = "https://argoscliente03-production.up.railway.app";
  
  const send = await fetch(`${url}/api/send`, { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ botNumber: "1234", number: "1234", message: "Hello" }) });
  console.log("send:", send.status, await send.text());

  const reset = await fetch(`${url}/api/reset`, { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ botNumber: "1234" }) });
  console.log("reset:", reset.status, await reset.text());

  const toggle = await fetch(`${url}/api/toggle`, { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ botNumber: "1234", active: true, isAutoReplyActive: true }) });
  console.log("toggle:", toggle.status, await toggle.text());
}
check();

async function check() {
  const url = "http://localhost:3000/api/bot-proxy";
  
  const status = await fetch(`${url}`, { headers: { "x-target-url": "https://argoscliente03-production.up.railway.app/api/status" } });
  console.log("status:", status.status, await status.text());

  const connect = await fetch(`${url}`, { method: "POST", headers: {"x-target-url": "https://argoscliente03-production.up.railway.app/api/connect", "Content-Type": "application/json"}, body: JSON.stringify({ botNumber: "1234" }) });
  console.log("connect:", connect.status, await connect.text());
}
check();

async function check() {
  const r1 = await fetch("https://argoscliente2-production.up.railway.app/api/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ botNumber: "5511999999999" })
  });
  console.log("start:", r1.status);
  console.log(await r1.text());

  const r2 = await fetch("https://argoscliente2-production.up.railway.app/api/connect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ botNumber: "5511999999999" })
  });
  console.log("connect:", r2.status);
  console.log(await r2.text());
}
check();

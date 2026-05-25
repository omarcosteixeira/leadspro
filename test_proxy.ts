async function doTest() {
  const res = await fetch("http://localhost:3000/api/bot-proxy", {
    headers: { "x-target-url": "https://argoscliente2-production.up.railway.app/api/status" }
  });
  console.log(res.status);
  console.log(await res.text());
}
doTest();

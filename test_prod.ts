async function doTest() {
  const res = await fetch("https://argoscliente2-production.up.railway.app/api/status");
  console.log(res.status);
  console.log(await res.text());
}
doTest();

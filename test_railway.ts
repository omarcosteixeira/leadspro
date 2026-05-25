async function check() {
  const url1 = "https://argoscliente03-production.up.railway.app/api/status";
  const url2 = "http://argoscliente03-production.up.railway.app:8080/api/status";
  try {
    const r1 = await fetch(url1);
    console.log(url1, r1.status, await r1.text());
  } catch (e) {
    console.log(url1, e.message);
  }
  try {
    const r2 = await fetch(url2);
    console.log(url2, r2.status, await r2.text());
  } catch (e) {
    console.log(url2, e.message);
  }
}
check();

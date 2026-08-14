// Testa upload de imagem para Supabase Storage
const BASE_URL = "https://meucorre.vercel.app";
const ADMIN_EMAIL = "clodoaldo608@gmail.com";
const ADMIN_PASSWORD = "Silva88677488@#";

async function main() {
  console.log("=== Login ===");
  const res = await fetch(`${BASE_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  if (!res.ok) throw new Error(`Login falhou: ${res.status}`);
  const setCookie = res.headers.getSetCookie?.() ?? [];
  const cookie = setCookie.map((c: string) => c.split(";")[0]).join("; ");
  console.log("✅ Login OK");

  // Cria uma imagem PNG pequena (1x1 pixel vermelho)
  console.log("\n=== Criando imagem de teste (1x1 PNG) ===");
  // Minimal 1x1 red PNG (base64)
  const PNG_BASE64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
  const pngBuffer = Buffer.from(PNG_BASE64, "base64");
  console.log(`Tamanho: ${pngBuffer.length} bytes`);

  // Cria FormData com o arquivo
  const formData = new FormData();
  const blob = new Blob([pngBuffer], { type: "image/png" });
  formData.append("file", blob, "test-upload.png");
  formData.append("source", "test_script");
  formData.append("altText", "Imagem de teste 1x1");
  formData.append("tags", "teste,upload");

  // Faz o upload
  console.log("\n=== Fazendo upload ===");
  const uploadRes = await fetch(`${BASE_URL}/api/admin/promotion/assets/upload`, {
    method: "POST",
    headers: { Cookie: cookie },
    body: formData,
  });

  console.log("Status:", uploadRes.status);
  const data = await uploadRes.json();

  if (uploadRes.ok) {
    console.log("\n🎉 UPLOAD FUNCIONOU!");
    console.log("Asset ID:", data.asset?.id);
    console.log("Name:", data.asset?.name);
    console.log("Public URL:", data.asset?.publicUrl);
    console.log("MIME:", data.asset?.mimeType);
    console.log("Size:", data.asset?.fileSize, "bytes");

    // Verifica se a URL é acessível
    if (data.asset?.publicUrl) {
      console.log("\n=== Verificando se URL é acessível ===");
      const checkRes = await fetch(data.asset.publicUrl, { method: "HEAD" });
      console.log("HTTP:", checkRes.status);
      console.log("Content-Type:", checkRes.headers.get("content-type"));
      console.log("Content-Length:", checkRes.headers.get("content-length"));
    }
  } else {
    console.log("\n❌ Upload falhou:");
    console.log(JSON.stringify(data, null, 2));
  }
}

main().catch(console.error);

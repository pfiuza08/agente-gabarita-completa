export default async function handler(req, res) {
  // ✅ Só aceitar requisições POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // 🔑 Verificar se a API Key está configurada
    console.log("🔑 Checando API Key:", process.env.OPENAI_API_KEY ? "✅ Existe" : "❌ NÃO ENCONTRADA");

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OPENAI_API_KEY não configurada no projeto." });
    }

    // 📩 Ler o corpo da requisição (mensagens do usuário)
    let body = {};
    try {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const raw = Buffer.concat(chunks).toString("utf8");
      body = raw ? JSON.parse(raw) : {};
    } catch (err) {
      console.error("❌ Erro ao processar body:", err);
      return res.status(400).json({ error: "Erro ao processar JSON do body." });
    }

    console.log("📩 Body recebido:", body);

    const messages = Array.isArray(body.messages) ? body.messages : [];

    // 🧠 Ler o prompt do sistema (em texto puro ou Base64)
    let systemPrompt = "Você é um assistente útil e responde sempre em português.";

    if (process.env.AGENT_SYSTEM) {
      systemPrompt = process.env.AGENT_SYSTEM;
      console.log("📄 Prompt carregado via texto direto.");
    } else if (process.env.AGENT_SYSTEM_B64) {
      try {
        systemPrompt = Buffer.from(process.env.AGENT_SYSTEM_B64, "base64").toString("utf8");
        console.log("📄 Prompt carregado via Base64.");
      } catch (e) {
        console.error("❌ Erro ao decodificar Base64:", e);
        return res.status(500).json({ error: "Erro ao decodificar AGENT_SYSTEM_B64." });
      }
    } else {
      console.warn("⚠️ Nenhum prompt personalizado encontrado. Usando prompt padrão.");
    }

    // 📨 Montar as mensagens para a OpenAI
    const input = [{ role: "system", content: systemPrompt }, ...messages];
    console.log("📨 Enviando para OpenAI:", input);

    // 📡 Chamada à API da OpenAI
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: input
      })
    });

    console.log("📡 Status da resposta da OpenAI:", r.status);
    const data = await r.json();
    console.log("📥 Dados recebidos:", data);

    // ❌ Se a API respondeu com erro
    if (!r.ok) {
      return res.status(500).json({ error: "Erro na chamada da OpenAI", details: data });
    }

    // ✅ Extrair a resposta corretamente
    const text =
      data?.choices?.[0]?.message?.content?.trim() ||
      data?.choices?.[0]?.delta?.content?.trim() ||
      "Sem resposta da OpenAI.";

    return res.status(200).json({ text });
  } catch (err) {
    console.error("💥 Erro inesperado no servidor:", err);
    return res.status(500).json({ error: "Erro inesperado no servidor.", details: err.message });
  }
}

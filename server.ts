import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Generous limit for HTML files or base64 embedded images
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API endpoint for testing bot connections and sending messages (Proxy)
  app.post("/api/bot-proxy", async (req, res) => {
    try {
      const { targetUrl, method, headers, body } = req.body;
      if (!targetUrl) {
        return res.status(400).json({ success: false, error: "Parâmetro targetUrl é obrigatório." });
      }

      if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
        return res.status(400).json({ success: false, error: "O targetUrl deve começar com http:// ou https://" });
      }

      const fetchOptions: RequestInit = {
        method: method || "GET",
        headers: {
          "Content-Type": "application/json",
          ...headers
        }
      };

      if (method && method.toUpperCase() === "POST" && body) {
        fetchOptions.body = JSON.stringify(body);
      }

      // 15 seconds timeout to prevent pending threads
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      fetchOptions.signal = controller.signal;

      try {
        const botResponse = await fetch(targetUrl, fetchOptions);
        clearTimeout(timeoutId);

        const contentType = botResponse.headers.get("content-type") || "";
        let data;
        if (contentType.includes("application/json")) {
          data = await botResponse.json().catch(() => ({}));
        } else {
          data = { text: await botResponse.text().catch(() => "") };
        }

        return res.status(botResponse.status).json({
          success: botResponse.ok,
          status: botResponse.status,
          error: !botResponse.ok ? (data?.error || data?.message || data?.text || `Retorno do bot: ${botResponse.status} ${botResponse.statusText}`) : undefined,
          data
        });
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (err.name === "AbortError" || err.code === "ETIMEDOUT") {
          return res.status(504).json({
            success: false,
            error: "Tempo limite esgotado (15 s). O bot no Railway está inativo ou demorando muito para responder."
          });
        }
        throw err;
      }
    } catch (err: any) {
      console.error("Bot Proxy error:", err);
      return res.status(502).json({
        success: false,
        error: `O servidor proxy do LeadsPro não conseguiu se conectar ao Bot no Railway. Ele pode estar reiniciando ou Offline. Detalhes: ${err.message}`
      });
    }
  });

  // API endpoint for Brevo E-mail Marketing sending
  app.post("/api/send-email", async (req, res) => {
    try {
      const apiKey = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY;
      if (!apiKey) {
        return res.status(401).json({
          success: false,
          error: "A chave de API do Brevo (BREVO_API_KEY) não está configurada no servidor. Por favor, adicione-a nas variáveis de ambiente."
        });
      }

      const { recipients, subject, body, senderName, senderEmail, attachments } = req.body;

      if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({ success: false, error: "Nenhum destinatário informado." });
      }

      if (!subject) {
        return res.status(400).json({ success: false, error: "O assunto é obrigatório." });
      }

      if (!body) {
        return res.status(400).json({ success: false, error: "O conteúdo do e-mail é obrigatório." });
      }

      // Configure Brevo SDK
      let SibApiV3Sdk;
      try {
        const mod = await import('sib-api-v3-sdk');
        SibApiV3Sdk = mod.default || mod;
      } catch (err) {
        console.error("Failed to load sib-api-v3-sdk", err);
        return res.status(500).json({ success: false, error: "Falha ao carregar a biblioteca de envio de email. Verifique as dependencias." });
      }

      if (!SibApiV3Sdk.ApiClient) {
        // Safe robust fallback to native REST API since we encountered CJS import issues prior
        const payload: any = {
          sender: {
            name: senderName || "Leads Pro Marketing",
            email: senderEmail || "estaciocomercialoeste@gmail.com"
          },
          to: recipients.map((email: string) => ({ email: email.trim() })),
          subject,
          htmlContent: body
        };
        if (attachments && Array.isArray(attachments) && attachments.length > 0) {
          payload.attachment = attachments;
        }

        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "api-key": apiKey,
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Erro retornado pela API do Brevo ao tentar enviar o e-mail.");
        }
        return res.json({ success: true, messageId: data.messageId });
      }

      const defaultClient = SibApiV3Sdk.ApiClient.instance;
      const apiKeyAuth = defaultClient.authentications['api-key'];
      apiKeyAuth.apiKey = apiKey;

      const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

      // Format recipients
      sendSmtpEmail.to = recipients.map((email: string) => ({ email: email.trim() }));
      
      sendSmtpEmail.sender = {
        name: senderName || "Leads Pro Marketing",
        email: senderEmail || "estaciocomercialoeste@gmail.com"
      };
      sendSmtpEmail.subject = subject;
      sendSmtpEmail.htmlContent = body;

      if (attachments && Array.isArray(attachments) && attachments.length > 0) {
        sendSmtpEmail.attachment = attachments;
      }

      const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
      return res.json({ success: true, messageId: data.messageId });
      
    } catch (err: any) {
      console.error("Internal mail send error:", err);
      // Brevo SDK usually throws err with err.response.text
      const errorResponse = err.response?.text ? JSON.parse(err.response.text) : null;
      let errMsg = errorResponse?.message || err.message || "Erro interno do servidor.";
      
      if (errMsg && errMsg.includes("unrecognised IP address")) {
        errMsg = "Bloqueio de Segurança da Brevo: Acesso bloqueado por IP. Para resolver, acesse sua conta Brevo em Configurações > Segurança (https://app.brevo.com/security/authorised_ips) e desabilite o controle de IPs Autorizados, ou assegure que esta chave SMTP não tenha restrição.";
      }

      return res.status(500).json({ 
        success: false, 
        error: errMsg 
      });
    }
  });

  // API endpoint for checking email status
  app.post("/api/email-status", async (req, res) => {
    try {
      const apiKey = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY;
      if (!apiKey) {
        return res.status(401).json({ success: false });
      }

      const { messageIds } = req.body;
      if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
        return res.status(400).json({ success: false });
      }

      const results: Record<string, string> = {};

      // Limit in check size to avoid too many requests at once. We'll check individually
      // because Brevo's GET /smtp/statistics/events requires a messageId parameter
      // Note: in a real big system we'd use webhooks for scalability.
      const checks = messageIds.slice(0, 10).map(async (msgId) => {
        try {
          const response = await fetch(`https://api.brevo.com/v3/smtp/statistics/events?messageId=${encodeURIComponent(msgId)}&limit=10`, {
            headers: {
              'api-key': apiKey,
              'Accept': 'application/json'
            }
          });
          if (response.ok) {
            const data = await response.json();
            if (data && data.events && data.events.length > 0) {
              // events are usually ordered, check if any is 'opened' or 'click'
              const hasOpened = data.events.some((e: any) => e.event === 'opened' || e.event === 'unique_opened' || e.event === 'click');
              const hasDelivered = data.events.some((e: any) => e.event === 'delivered');
              
              if (hasOpened) {
                results[msgId] = 'opened';
              } else if (hasDelivered) {
                results[msgId] = 'delivered';
              } else {
                results[msgId] = 'sent';
              }
            }
          }
        } catch (e) {
          // ignore individual fails
        }
      });

      await Promise.all(checks);
      return res.json({ success: true, statuses: results });
    } catch (err) {
      return res.status(500).json({ success: false });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

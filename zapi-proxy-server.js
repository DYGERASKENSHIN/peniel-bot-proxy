const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const ZAPI = {
  instance: (process.env.ZAPI_INSTANCE || '3F87058E92E8725FE909E25B2C234100').trim(),
  token: (process.env.ZAPI_TOKEN || '70E0D276047D162D196DA2535').trim(),
  baseUrl: (process.env.ZAPI_BASE || 'https://api2.z-api.io').trim().replace(/\/$/,'')
};

console.log('Config Z-API:', { instance: ZAPI.instance.substring(0,8)+'...', base: ZAPI.baseUrl });

app.get('/', (req,res)=>{
  res.send('Bot Peniel Z-API Proxy Online ✅ - Use POST /enviar');
});

app.get('/status', async (req,res)=>{
  try{
    const url = `${ZAPI.baseUrl}/instances/${ZAPI.instance}/token/${ZAPI.token}/status`;
    const r = await fetch(url);
    const j = await r.json();
    res.json({ proxy: 'online', zapi: j, config: { instance: ZAPI.instance.substring(0,8)+'...', base: ZAPI.baseUrl } });
  }catch(e){
    res.json({ proxy: 'online', zapi_error: e.message });
  }
});

app.post('/enviar', async (req,res)=>{
  try{
    const { nome, zap, servico, barbeiro, data, hora, valor } = req.body;
    console.log('Recebido:', { nome, zap });
    
    let zapLimpo = (zap||'').toString().replace(/\D/g,'');
    if(!zapLimpo) return res.status(400).json({ sucesso: false, erro: 'Zap vazio' });
    if(!zapLimpo.startsWith('55')) zapLimpo = '55'+zapLimpo;
    if(zapLimpo.length < 12) return res.status(400).json({ sucesso: false, erro: 'Número inválido: '+zapLimpo });
    
    const msg = `Olá ${nome||'cliente'}! ✂️

Obrigado por agendar na nossa barbearia Peniel! 💈

✅ Seu agendamento foi confirmado:
💈 Serviço: ${servico}
👨‍🦲 Barbeiro: ${barbeiro}
📅 Data: ${data} às ${hora}
💰 Valor: R$ ${valor}
📍 Local: Rua Gaspar Dias de Ataide, 199

⏰ Chegue com 10min de antecedência.
🎂 No mês do seu aniversário você ganha 20% OFF!

Qualquer dúvida chama aqui! 👊

- Equipe Peniel Barbearia`;

    const url = `${ZAPI.baseUrl}/instances/${ZAPI.instance}/token/${ZAPI.token}/send-text`;
    console.log('Chamando Z-API:', url.replace(ZAPI.token,'TOKEN'), 'para', zapLimpo);

    let lastError = null;
    for(let tentativa=1; tentativa<=2; tentativa++){
      try{
        const zapiResp = await fetch(url, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ phone: zapLimpo, message: msg })
        });
        
        const text = await zapiResp.text();
        let zapiResult;
        try{ zapiResult = JSON.parse(text); }catch{ zapiResult = { raw: text }; }
        
        console.log(`Tentativa ${tentativa} - Status ${zapiResp.status}:`, zapiResult);
        
        if(zapiResp.ok && !zapiResult.error){
          return res.json({ sucesso: true, mensagem: msg, resposta: zapiResult, tentativa });
        }
        lastError = zapiResult;
        // Se erro de auth, não tenta de novo
        if(zapiResult.error && zapiResult.error.includes('token')) break;
      }catch(fetchErr){
        console.error(`Tentativa ${tentativa} falhou:`, fetchErr.message);
        lastError = { message: fetchErr.message, type: 'fetch_failed' };
        await new Promise(r=>setTimeout(r, 2000));
      }
    }
    
    console.error('Falha final Z-API:', lastError);
    return res.status(400).json({ sucesso: false, erro: lastError, mensagem: msg, dica: 'Verifique se a instancia Z-API esta CONECTADA em app.z-api.io - escaneie o QR Code se precisar' });
    
  }catch(err){
    console.error('Erro proxy geral:', err);
    res.status(500).json({ sucesso: false, erro: err.message, stack: err.stack });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, ()=>console.log('Proxy Peniel rodando na porta '+PORT+' - Live!'));

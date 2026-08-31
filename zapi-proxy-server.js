const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const ZAPI_INSTANCE = (process.env.ZAPI_INSTANCE || '3F87058E92E8725FE909E25B2C234100').trim();
const ZAPI_TOKEN = (process.env.ZAPI_TOKEN || '70ED276047D162D196DA2535').trim();
const ZAPI_BASE = (process.env.ZAPI_BASE || 'https://api1.z-api.io').trim().replace(/\/$/,'');

console.log('Z-API Config Final:', { base: ZAPI_BASE, instance: ZAPI_INSTANCE.substring(0,8)+'...', token: ZAPI_TOKEN.substring(0,8)+'...' });

app.get('/', (req,res)=> res.send('Bot Peniel Proxy Online ✅ - api1.z-api.io - POST /enviar'));

app.get('/status', async (req,res)=>{
  try{
    const url = `${ZAPI_BASE}/instances/${ZAPI_INSTANCE}/token/${ZAPI_TOKEN}/status`;
    console.log('Status check:', url.replace(ZAPI_TOKEN,'TOKEN'));
    const r = await fetch(url, { headers: { 'User-Agent': 'PenielBot/1.0' } });
    const txt = await r.text();
    let j; try{ j=JSON.parse(txt); }catch{ j={raw:txt}; }
    res.json({ proxy: 'online', base: ZAPI_BASE, instance: ZAPI_INSTANCE.substring(0,8)+'...', zapi_status_code: r.status, zapi: j });
  }catch(e){
    res.json({ proxy: 'online', base: ZAPI_BASE, error: e.message, cause: e.cause?.message });
  }
});

app.post('/enviar', async (req,res)=>{
  try{
    const { nome, zap, servico, barbeiro, data, hora, valor } = req.body;
    let zapLimpo = (zap||'').toString().replace(/\D/g,'');
    if(!zapLimpo.startsWith('55')) zapLimpo = '55'+zapLimpo;

    const msg = `Olá ${nome||'cliente'}! ✂️\n\nObrigado por agendar na nossa barbearia Peniel! 💈\n\n✅ Seu agendamento foi confirmado:\n💈 Serviço: ${servico}\n👨‍🦲 Barbeiro: ${barbeiro}\n📅 Data: ${data} às ${hora}\n💰 Valor: R$ ${valor}\n📍 Local: Rua Gaspar Dias de Ataide, 199\n\n⏰ Chegue com 10min de antecedência.\n🎂 No mês do seu aniversário você ganha 20% OFF!\n\nQualquer dúvida chama aqui! 👊\n\n- Equipe Peniel Barbearia`;

    const url = `${ZAPI_BASE}/instances/${ZAPI_INSTANCE}/token/${ZAPI_TOKEN}/send-text`;
    console.log('Enviando para Z-API:', zapLimpo, 'via', ZAPI_BASE);

    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: zapLimpo, message: msg })
    });
    
    const txt = await resp.text();
    let data; try{ data = JSON.parse(txt); }catch{ data = { raw: txt }; }
    console.log('Resposta Z-API', resp.status, JSON.stringify(data).substring(0,600));

    if(resp.ok){
      return res.json({ sucesso: true, mensagem: msg, resposta: data, base: ZAPI_BASE });
    } else {
      return res.status(resp.status).json({ sucesso: false, erro: data, mensagem: msg, base: ZAPI_BASE });
    }
  }catch(err){
    console.error('Erro enviar:', err);
    res.status(500).json({ sucesso: false, erro: err.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, ()=>console.log('Proxy FINAL rodando porta '+PORT+' base '+ZAPI_BASE));

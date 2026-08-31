const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const ZAPI_INSTANCE = (process.env.ZAPI_INSTANCE || '3F87058E92E8725FE909E25B2C234100').trim();
const ZAPI_TOKEN = (process.env.ZAPI_TOKEN || '70E0D276047D162D196DA2535').trim();
const BASES = [
  (process.env.ZAPI_BASE || 'https://api2.z-api.io').trim().replace(/\/$/,''),
  'https://api.z-api.io',
  'https://api2.z-api.io'
].filter((v,i,a)=>a.indexOf(v)===i);

console.log('Z-API Bases para tentar:', BASES);

app.get('/', (req,res)=> res.send('Bot Peniel Proxy Online ✅ POST /enviar'));

app.get('/status', async (req,res)=>{
  const results = [];
  for(const base of BASES){
    try{
      const url = `${base}/instances/${ZAPI_INSTANCE}/token/${ZAPI_TOKEN}/status`;
      console.log('Testando status:', base);
      const r = await fetch(url, { headers: { 'User-Agent': 'PenielBot/1.0' } });
      const txt = await r.text();
      let j; try{ j=JSON.parse(txt); }catch{ j={raw:txt.substring(0,300)}; }
      results.push({ base, statusCode: r.status, result: j });
      if(r.ok) break;
    }catch(e){
      results.push({ base, error: e.message, cause: e.cause?.message || '' });
    }
  }
  res.json({ proxy: 'online', instance: ZAPI_INSTANCE.substring(0,8)+'...', tests: results });
});

app.post('/enviar', async (req,res)=>{
  const { nome, zap, servico, barbeiro, data, hora, valor } = req.body;
  console.log('POST /enviar recebido:', { nome, zap });
  
  let zapLimpo = (zap||'').toString().replace(/\D/g,'');
  if(!zapLimpo.startsWith('55')) zapLimpo = '55'+zapLimpo;

  const msg = `Olá ${nome||'cliente'}! ✂️\n\nObrigado por agendar na nossa barbearia Peniel! 💈\n\n✅ Confirmado:\n💈 ${servico}\n👨‍🦲 ${barbeiro}\n📅 ${data} às ${hora}\n💰 R$ ${valor}\n📍 Rua Gaspar Dias de Ataide, 199\n\nChegue com 10min de antecedência!`;

  let lastError = null;
  
  for(const base of BASES){
    const url = `${base}/instances/${ZAPI_INSTANCE}/token/${ZAPI_TOKEN}/send-text`;
    console.log(`Tentando base ${base} -> ${zapLimpo}`);
    try{
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'PenielBot/1.0',
          'Client-Token': ZAPI_TOKEN
        },
        body: JSON.stringify({ phone: zapLimpo, message: msg })
      });
      
      const txt = await resp.text();
      let data;
      try{ data = JSON.parse(txt); }catch{ data = { raw: txt }; }
      
      console.log(`Resposta ${base} ${resp.status}:`, JSON.stringify(data).substring(0,500));
      
      if(resp.ok && !data.error){
        return res.json({ sucesso: true, base_usada: base, mensagem: msg, resposta: data });
      }
      
      // Se erro for de auth/instance, para de tentar outras bases
      if(data && (JSON.stringify(data).toLowerCase().includes('instance') || JSON.stringify(data).toLowerCase().includes('token') || JSON.stringify(data).toLowerCase().includes('not found'))){
        lastError = { base, status: resp.status, data, dica: 'Verifique se INSTANCE e TOKEN estao corretos e se instancia esta CONECTADA em app.z-api.io' };
        break;
      }
      
      lastError = { base, status: resp.status, data };
      
      // Se for erro de desconectado, não adianta tentar outra base
      if(JSON.stringify(data).toLowerCase().includes('disconnected') || JSON.stringify(data).toLowerCase().includes('qrcode') || JSON.stringify(data).toLowerCase().includes('desconectado')){
        lastError.dica = 'Z-API DESCONECTADA! Va em app.z-api.io e escaneie o QR Code';
        break;
      }
      
    }catch(fetchErr){
      console.error(`Fetch falhou na base ${base}:`, fetchErr.message, fetchErr.cause);
      lastError = { base, error: fetchErr.message, cause: fetchErr.cause?.message || '', stack: fetchErr.stack?.substring(0,300) };
      continue;
    }
  }
  
  console.error('Todas as bases falharam:', lastError);
  return res.status(400).json({ 
    sucesso: false, 
    erro: lastError, 
    mensagem: msg,
    dica_final: '1) Abra https://app.z-api.io e veja se instancia esta CONECTADA verde. 2) Se estiver desconectada, escaneie QR. 3) Teste manualmente: https://peniel-bot-proxy.onrender.com/status'
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, ()=>console.log('Proxy Peniel V3 rodando porta '+PORT));

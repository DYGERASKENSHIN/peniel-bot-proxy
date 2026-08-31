const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const INST = (process.env.ZAPI_INSTANCE || '3F87058E92E8725FE909E25B2C234100').trim();
const TOK = (process.env.ZAPI_TOKEN || '70ED276047D162D196DA2535').trim();
const BASE = (process.env.ZAPI_BASE || 'https://api1.z-api.io').trim();

app.get('/', (req,res)=> res.send('Peniel Proxy OK api1 - POST /enviar'));

app.get('/status', async (req,res)=>{
  try{
    const u = `${BASE}/instances/${INST}/token/${TOK}/status`;
    const r = await fetch(u);
    const t = await r.text();
    let j; try{ j=JSON.parse(t); }catch{ j={raw:t.slice(0,500)}; }
    res.json({ proxy:'online', base:BASE, zapi_code:r.status, zapi:j });
  }catch(e){
    res.json({ proxy:'online', error:e.message });
  }
});

app.post('/enviar', async (req,res)=>{
  try{
    const { nome, zap, servico, barbeiro, data, hora, valor } = req.body;
    let fone = (zap||'').toString().replace(/\D/g,'');
    if(!fone.startsWith('55')) fone='55'+fone;
    const mensagem = `Ola ${nome}! Obrigado por agendar na Peniel! Servico: ${servico} Barbeiro: ${barbeiro} Data: ${data} as ${hora} Valor: R$ ${valor}`;
    const url = `${BASE}/instances/${INST}/token/${TOK}/send-text`;
    const resp = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ phone:fone, message:mensagem }) });
    const txtResp = await resp.text();
    let jsonResp; try{ jsonResp=JSON.parse(txtResp); }catch{ jsonResp={raw:txtResp}; }
    if(resp.ok) return res.json({ sucesso:true, mensagem, resposta:jsonResp });
    return res.status(resp.status).json({ sucesso:false, erro:jsonResp, mensagem });
  }catch(er){
    res.status(500).json({ sucesso:false, erro:er.message });
  }
});

app.listen(process.env.PORT||10000, ()=>console.log('Proxy limpo rodando'));

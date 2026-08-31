const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const INST = (process.env.ZAPI_INSTANCE || '3F87058E92E8725FE909E25B2C234100').trim();
const TOK = (process.env.ZAPI_TOKEN || '70ED276047D162D196DA2535').trim();
const BASES = [
  (process.env.ZAPI_BASE || 'https://api.z-api.io').trim(),
  'https://api.z-api.io',
  'https://api1.z-api.io',
  'https://api2.z-api.io'
].filter((v,i,a)=>a.indexOf(v)===i);

app.get('/', (req,res)=> res.send('Peniel Proxy - Bases: '+BASES.join(', ')));

app.get('/status', async (req,res)=>{
  const out=[];
  for(const B of BASES){
    try{
      const url=`${B}/instances/${INST}/token/${TOK}/status`;
      const r=await fetch(url, { headers:{'User-Agent':'PenielBot'} });
      const t=await r.text();
      let j; try{ j=JSON.parse(t); }catch{ j={raw:t.slice(0,400)}; }
      out.push({base:B, code:r.status, ok:r.ok, body:j});
      if(r.ok) break;
    }catch(e){
      out.push({base:B, error:e.message, cause:e.cause?.message||''});
    }
  }
  res.json({proxy:'online', bases:BASES, results:out});
});

app.post('/enviar', async (req,res)=>{
  const { nome, zap, servico, barbeiro, data, hora, valor } = req.body;
  let fone=(zap||'').toString().replace(/\D/g,'');
  if(!fone.startsWith('55')) fone='55'+fone;
  const msg=`Ola ${nome}! Obrigado por agendar na Peniel! Servico:${servico} Barbeiro:${barbeiro} Data:${data} as ${hora} Valor:R$ ${valor}`;
  let last=null;
  for(const B of BASES){
    try{
      const url=`${B}/instances/${INST}/token/${TOK}/send-text`;
      const r=await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ phone:fone, message:msg }) });
      const t=await r.text();
      let j; try{ j=JSON.parse(t); }catch{ j={raw:t}; }
      console.log('Tentativa',B,r.status);
      if(r.ok && !j.error) return res.json({ sucesso:true, base:B, mensagem:msg, resposta:j });
      last={base:B, code:r.status, body:j};
      if(JSON.stringify(j).toLowerCase().includes('disconnected')) break;
    }catch(e){
      last={base:B, error:e.message};
    }
  }
  res.status(400).json({ sucesso:false, ultimo_erro:last, mensagem:msg, dica:'Teste /status' });
});

app.listen(process.env.PORT||10000, ()=>console.log('Proxy multi-base',BASES));

const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

const ZAPI = {
  instance: process.env.ZAPI_INSTANCE || '3F87058E92E8725FE909E25B2C234100',
  token: process.env.ZAPI_TOKEN || '70E0D276047D162D196DA2535',
  baseUrl: process.env.ZAPI_BASE || 'https://api2.z-api.io'
};

app.get('/', (req,res)=>{
  res.send('Bot Peniel Z-API Proxy Online - POST /enviar');
});

app.post('/enviar', async (req,res)=>{
  try{
    const { nome, zap, servico, barbeiro, data, hora, valor } = req.body;
    let zapLimpo = (zap||'').toString().replace(/\D/g,'');
    if(!zapLimpo.startsWith('55')) zapLimpo = '55'+zapLimpo;
    
    const msg = `Olá ${nome}! \n\nObrigado por agendar na nossa barbearia Peniel! \n\nServiço: ${servico}\nBarbeiro: ${barbeiro}\nData: ${data} às ${hora}\nValor: R$ ${valor}\nLocal: Rua Gaspar Dias de Ataide, 199\n\nChegue com 10min de antecedência.`;

    const url = `${ZAPI.baseUrl}/instances/${ZAPI.instance}/token/${ZAPI.token}/send-text`;
    console.log('Enviando Z-API para:', zapLimpo);

    const zapiResp = await fetch(url, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ phone: zapLimpo, message: msg })
    });
    
    const zapiResult = await zapiResp.json();
    console.log('Resposta Z-API:', zapiResult);
    
    if(zapiResp.ok){
      res.json({ sucesso: true, mensagem: msg, resposta: zapiResult });
    } else {
      res.status(400).json({ sucesso: false, erro: zapiResult, mensagem: msg });
    }
  }catch(err){
    console.error('Erro proxy:', err);
    res.status(500).json({ sucesso: false, erro: err.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, ()=>console.log('Proxy rodando na porta '+PORT));

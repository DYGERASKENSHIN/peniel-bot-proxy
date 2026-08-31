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
  res.send('Bot Peniel Z-API Proxy Online ✅ - POST /enviar com {nome, zap, servico, barbeiro, data, hora, valor}');
});

app.post('/enviar', async (req,res)=>{
  try{
    const { nome, zap, servico, barbeiro, data, hora, valor } = req.body;
    let zapLimpo = (zap||'').replace(/\D/g,'');
    if(!zapLimpo.startsWith('55')) zapLimpo = '55'+zapLimpo;
    
    const msg = `Olá ${nome}! ✂️

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
    console.log('Enviando para Z-API:', url, 'numero:', zapLimpo);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ phone: zapLimpo, message: msg })
    });
    
    const data = await response.json();
    console.log('Resposta Z-API:', data);
    
    if(response.ok && !data.error){
      res.json({ sucesso: true, mensagem: msg, resposta: data });
    } else {
      res.status(400).json({ sucesso: false, erro: data, mensagem: msg });
    }
  }catch(e){
    console.error('Erro proxy:', e);
    res.status(500).json({ sucesso: false, erro: e.message });
  }
});

app.post('/teste', async (req,res)=>{
  const { zap } = req.body;
  return res.redirect(307, '/enviar');
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, ()=>console.log('Proxy rodando na porta', PORT));

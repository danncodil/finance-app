import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  // Configuração de CORS simples (útil caso testado localmente)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'O campo "text" é obrigatório.' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'A chave GEMINI_API_KEY não está configurada no servidor Vercel.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const prompt = `Você é um assistente financeiro especialista em extrair dados de textos naturais.
Baseado na descrição do usuário, extraia as seguintes informações e retorne SOMENTE UM JSON perfeitamente formatado, sem markdown, sem crases, sem texto adicional.

Formato esperado:
{
  "amount": número (ex: 50.5),
  "description": string (ex: "iFood"),
  "transaction_type": "income" ou "expense",
  "profile_type": "personal" ou "business"
}

Regras:
1. "amount": Deve ser sempre um número positivo (apenas o valor absoluto).
2. "description": Tente resumir ou extrair a entidade principal com a primeira letra maiúscula (ex: "iFood", "Padaria da Esquina", "Cliente João").
3. "transaction_type": Se for um gasto/pagamento/compra é "expense". Se for recebimento/salário/venda é "income".
4. "profile_type": Se parecer algo da vida pessoal (comida, netflix, cinema, roupas) é "personal". Se parecer negócio/empresa (compra de materiais, pagamento de fornecedor, venda de serviço, ferramentas) é "business".

Texto do usuário: "${text}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    let resultText = response.text;
    // Ocasionalmente a IA devolve o JSON dentro de blocos de markdown ```json ... ```
    // Vamos limpar isso para não quebrar o JSON.parse
    resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const jsonResult = JSON.parse(resultText);

    return res.status(200).json(jsonResult);
  } catch (error) {
    console.error("Gemini Parse Error:", error);
    return res.status(500).json({ 
      error: 'Erro interno ao processar a inteligência artificial.', 
      details: error.message 
    });
  }
}

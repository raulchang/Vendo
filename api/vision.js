export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { imageBase64 } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ error: 'No image provided' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 150,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyse cette image et retourne UNIQUEMENT un JSON avec ces champs (sans markdown) :
{"category":"sneakers|tech|vetements|sport|vintage|jeux|maison|autre","brand":"nom de la marque ou vide","keywords":["mot1","mot2"],"description":"description courte en français"}`
            },
            {
              type: 'image_url',
              image_url: { url: imageBase64, detail: 'low' }
            }
          ]
        }]
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(500).json({ error: data.error?.message || 'OpenAI error' });
    }

    const content = data.choices?.[0]?.message?.content || '{}';
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { category: 'autre', brand: '', keywords: [], description: content };
    }

    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

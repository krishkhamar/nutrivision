const MAX_ITEMS = 8;

const extractJson = (content) => {
  const text = Array.isArray(content) ? content.map((part) => part.text || '').join('') : content;
  const match = String(text || '').match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Vision provider returned an invalid response');
  return JSON.parse(match[0]);
};

exports.scan = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'A JPEG, PNG, or WebP image is required.' });
  if (!process.env.GEMINI_API_KEY) return res.status(503).json({ message: 'Food scanning is not configured. Add GEMINI_API_KEY to backend/.env.' });
  try {
    const prompt = `Analyze this meal photo. Identify up to ${MAX_ITEMS} visible foods. Estimate a conservative serving in grams and calories/macros. Return JSON only in this exact form: {"items":[{"name":"string","servingGrams":number,"calories":number,"protein":number,"carbs":number,"fats":number,"confidence":number}]}. Do not identify people or make medical claims. If you cannot identify food, return {"items":[]}.`;
    const model = encodeURIComponent(process.env.GEMINI_MODEL || 'gemini-3.6-flash');
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [
            { text: prompt },
            { inline_data: { mime_type: req.file.mimetype, data: req.file.buffer.toString('base64') } },
          ],
        }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
      }),
    });
    if (!response.ok) {
      const providerBody = await response.text();
      let providerMessage = `Gemini request failed (${response.status})`;
      try {
        providerMessage = JSON.parse(providerBody)?.error?.message || providerMessage;
      } catch (_) {
        // Keep the status-only message if Gemini did not return JSON.
      }
      console.error(`Gemini API error (${response.status}): ${providerMessage}`);
      return res.status(502).json({ message: `Gemini error: ${providerMessage}` });
    }
    const payload = await response.json();
    const text = payload.candidates?.[0]?.content?.parts?.find((part) => part.text)?.text;
    const result = extractJson(text);
    const items = Array.isArray(result.items) ? result.items.slice(0, MAX_ITEMS).filter((item) => item.name && ['servingGrams', 'calories', 'protein', 'carbs', 'fats'].every((key) => Number.isFinite(Number(item[key])))).map((item) => ({
      name: String(item.name).slice(0, 100), servingGrams: Math.max(1, Number(item.servingGrams)), calories: Math.max(0, Math.round(Number(item.calories))), protein: Math.max(0, Math.round(Number(item.protein))), carbs: Math.max(0, Math.round(Number(item.carbs))), fats: Math.max(0, Math.round(Number(item.fats))), confidence: Math.min(1, Math.max(0, Number(item.confidence) || 0)),
    })) : [];
    res.json({ items, requiresReview: true, disclaimer: 'AI estimates can be inaccurate. Review each item and serving before saving.' });
  } catch (error) {
    console.error('Food scan error:', error.message);
    res.status(502).json({ message: 'Unable to analyze this photo. Try another image or add the meal manually.' });
  }
};

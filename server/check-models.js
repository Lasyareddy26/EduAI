// server/debug-models.js
require('dotenv').config();

async function listModelsRaw() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error("❌ No API Key in .env");
    return;
  }

  console.log(`🔑 Checking models for key ending in: ...${apiKey.slice(-4)}`);
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.error("\n❌ API ERROR:");
      console.error(data.error.message);
      return;
    }

    if (!data.models) {
      console.log("\n⚠️ No models found. Your project might need the API enabled.");
      return;
    }

    console.log("\n✅ AVAILABLE MODELS:");
    console.log("----------------------");
    // Filter for "generateContent" models only
    const contentModels = data.models.filter(m => m.supportedGenerationMethods.includes("generateContent"));
    
    contentModels.forEach(m => {
      console.log(`• ${m.name.replace('models/', '')}`); // Prints clean names like 'gemini-1.5-flash'
    });
    console.log("----------------------");
    
  } catch (err) {
    console.error("Network Error:", err);
  }
}

listModelsRaw();
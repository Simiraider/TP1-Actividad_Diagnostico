import { getDestinations } from '../../lib/destinations-db.js';

export const prerender = false;

export async function POST({ request }) {
  const GEMINI_API_KEY = import.meta.env.GEMINI_API_KEY || import.meta.env.PUBLIC_GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: 'Falta configurar GEMINI_API_KEY en el servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    const { isMultiTrip, destTitle, destCategory, destDetailsStr, people, ageGroup, days, budget } = body;

    const ageLabels = {
      'familia-mixta': 'familia con personas de distintas edades',
      'jovenes': 'jóvenes de 18 a 30 años',
      'adultos': 'adultos de 30 a 55 años',
      'adultos-mayores': 'adultos mayores de 55+ años',
      'ninos': 'familia con niños pequeños'
    };

    let prompt = '';

    if (isMultiTrip) {
      prompt = `Actúa como un experto agente de viajes. Planifica un viaje multidestino, respetando las fechas indicadas para cada lugar.

Lugares y Fechas estipuladas:
${destDetailsStr}

Datos generales del viaje:
- ${people} personas
- Grupo: ${ageLabels[ageGroup] || ageGroup}
- Duración total en días (aproximada): ${days}
- Presupuesto: ${budget}

Distribuye lógicamente los días entre los destinos (por ejemplo, considera que cruzar países o ciudades lejanas toma tiempo, asigna días para vuelo/traslado). Generame un cronograma hora por hora para cada día.

Responde SOLO con JSON válido (sin markdown, sin backticks), con esta estructura exacta:
{
  "tripSummary": "Brevísima descripción del viaje y por qué la distribución de días es ideal",
  "days": [
    {
      "dayNumber": 1,
      "title": "Día 1: Llegada a [Destino] e inicio del viaje",
      "activities": [
        {
          "time": "10:00",
          "name": "Llegada y check-in",
          "description": "Llegada al primer destino, instalación en el alojamiento",
          "locationUrl": ""
        }
      ]
    }
  ]
}

Para cada actividad turística, el 'locationUrl' DEBE ser un link real de búsqueda de Google Maps siguiendo este formato: https://www.google.com/maps/search/?api=1&query=[nombre_del_lugar]+[nombre_de_la_ciudad].
Ej: "https://www.google.com/maps/search/?api=1&query=Coliseo+Roma". 

Incluye actividades variadas y tiempos de traslado inter-ciudades/países (vuelos o trenes figurativos). Todo en español.`;
    } else {
      prompt = `Generame un itinerario de viaje detallado para ${destTitle} (categoría: ${destCategory}).

Datos del viaje:
- ${people} personas
- Grupo: ${ageLabels[ageGroup] || ageGroup}
- ${days} días de estadía
- Presupuesto: ${budget}

Generame un cronograma hora por hora para cada día. Responde SOLO con JSON válido (sin markdown, sin backticks), con esta estructura exacta:
{
  "days": [
    {
      "dayNumber": 1,
      "title": "Título descriptivo del día",
      "activities": [
        {
          "time": "08:00",
          "name": "Nombre de la actividad",
          "description": "Descripción breve de la actividad, tips y recomendaciones",
          "locationUrl": "URL de búsqueda en Google Maps para esta actividad específica"
        }
      ]
    }
  ]
}

Para cada actividad, el 'locationUrl' DEBE ser un link real de búsqueda de Google Maps siguiendo este formato: https://www.google.com/maps/search/?api=1&query=[nombre_del_lugar]+[nombre_de_la_ciudad]
Por ejemplo, si la actividad es "Desayuno en Café de Flore, París", el locationUrl debe ser "https://www.google.com/maps/search/?api=1&query=Cafe+de+Flore+Paris". 

Incluye actividades variadas: desayuno, visitas turísticas, almuerzo, actividades de la tarde, cena, etc. Adapta las actividades al grupo de edad. Incluye entre 6 y 10 actividades por día. Usa horarios realistas. Todo en español.`;
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 8192
          }
        })
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `Error de API de Gemini: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) throw new Error('La IA no generó una respuesta válida');

    const cleanText = text.replace(/\`\`\`json\n?/g, '').replace(/\`\`\`\n?/g, '').trim();
    const jsonResult = JSON.parse(cleanText);

    return new Response(JSON.stringify(jsonResult), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('[API /generate] Error:', err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

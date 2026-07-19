// Fetches real Google reviews for the business via the Places API (New).
// Requires a GOOGLE_PLACES_API_KEY environment variable set in the Netlify
// dashboard (Site configuration -> Environment variables). The key stays
// server-side here so it's never exposed to the browser.
const PLACE_ID = "ChIJc_tdSLE_sz4R2EDiwxjdb28"; // Reverb Merch, Karachi

exports.handler = async function () {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      body: JSON.stringify({ configured: false }),
    };
  }

  try {
    const url = `https://places.googleapis.com/v1/places/${PLACE_ID}?fields=displayName,rating,userRatingCount,reviews,googleMapsUri`;
    const res = await fetch(url, {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "displayName,rating,userRatingCount,reviews,googleMapsUri",
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
        body: JSON.stringify({ configured: true, error: `Places API error ${res.status}`, detail: errText }),
      };
    }

    const data = await res.json();
    const reviews = (data.reviews || []).map((r) => ({
      author: r.authorAttribution?.displayName || "Google User",
      photo: r.authorAttribution?.photoUri || null,
      rating: r.rating,
      text: r.text?.text || "",
      relativeTime: r.relativePublishTimeDescription || "",
    }));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=3600" },
      body: JSON.stringify({
        configured: true,
        name: data.displayName?.text || "Reverb Merch",
        rating: data.rating || null,
        total: data.userRatingCount || 0,
        mapsUri: data.googleMapsUri || null,
        reviews,
      }),
    };
  } catch (err) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      body: JSON.stringify({ configured: true, error: err.message }),
    };
  }
};

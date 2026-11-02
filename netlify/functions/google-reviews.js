// Fetches real Google reviews for the business via the Places API (New).
// Environment variables (Netlify dashboard -> Site configuration ->
// Environment variables):
//   GOOGLE_PLACES_API_KEY  - required. Places API (New) key; stays server-side.
//   GOOGLE_PLACE_ID        - optional, overrides the default Place ID below.
// Google returns at most 5 reviews per place (its "most relevant" pick).
// Responses are cached on Netlify's CDN for 6 hours so the API is called a
// handful of times a day, not once per visitor.
const DEFAULT_PLACE_ID = "ChIJc_tdSLE_sz4R2EDiwxjdb28"; // Reverb Merch, Karachi
const FIELDS = "displayName,rating,userRatingCount,reviews,googleMapsUri";

function json(body, cache) {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": cache ? "public, max-age=900" : "no-store",
      ...(cache ? { "Netlify-CDN-Cache-Control": "public, durable, s-maxage=21600, stale-while-revalidate=86400" } : {}),
    },
    body: JSON.stringify(body),
  };
}

exports.handler = async function () {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID || DEFAULT_PLACE_ID;

  if (!apiKey) return json({ configured: false });

  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}?languageCode=en`, {
      headers: { "X-Goog-Api-Key": apiKey, "X-Goog-FieldMask": FIELDS },
    });

    if (!res.ok) {
      const errText = await res.text();
      return json({ configured: true, error: `Places API error ${res.status}`, detail: errText.slice(0, 500) });
    }

    const data = await res.json();
    const reviews = (data.reviews || [])
      .map((r) => ({
        author: r.authorAttribution?.displayName || "Google User",
        photo: r.authorAttribution?.photoUri || null,
        profile: r.authorAttribution?.uri || null,
        rating: r.rating,
        text: r.text?.text || r.originalText?.text || "",
        relativeTime: r.relativePublishTimeDescription || "",
        time: r.publishTime || null,
      }))
      .filter((r) => r.text);

    return json(
      {
        configured: true,
        source: "google",
        name: data.displayName?.text || "Reverb Merch",
        rating: data.rating || null,
        total: data.userRatingCount || 0,
        mapsUri: data.googleMapsUri || null,
        writeReviewUri: `https://search.google.com/local/writereview?placeid=${placeId}`,
        reviews,
      },
      true
    );
  } catch (err) {
    return json({ configured: true, error: err.message });
  }
};

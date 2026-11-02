// Fetches real Facebook Page recommendations (reviews) via the Graph API.
// Environment variables (Netlify dashboard -> Site configuration ->
// Environment variables):
//   META_PAGE_ACCESS_TOKEN - required. A Page access token for the Reverb
//                            Merch Facebook Page with pages_read_user_content
//                            and pages_read_engagement. A Page token generated
//                            from a long-lived User token does not expire, so
//                            this is a one-time setup. The same token powers
//                            the Instagram feed (instagram-feed.js).
//   FACEBOOK_PAGE_ID       - required. Numeric ID of the Facebook Page.
//   META_GRAPH_VERSION     - optional, defaults to v23.0.
// Setup steps are in DEVELOPER.md -> "Live Reviews & Instagram Feed".
const GRAPH = () => `https://graph.facebook.com/${process.env.META_GRAPH_VERSION || "v23.0"}`;

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

async function graph(path, token) {
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`${GRAPH()}/${path}${sep}access_token=${encodeURIComponent(token)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    throw new Error(`Graph API ${res.status}: ${data.error?.message || "request failed"}`);
  }
  return data;
}

exports.handler = async function () {
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  const pageId = process.env.FACEBOOK_PAGE_ID;

  if (!token || !pageId) return json({ configured: false });

  try {
    const [page, ratings] = await Promise.all([
      graph(`${pageId}?fields=name,link,overall_star_rating,rating_count`, token),
      graph(`${pageId}/ratings?fields=created_time,recommendation_type,review_text,rating,reviewer{name,picture}&limit=50`, token),
    ]);

    const all = ratings.data || [];
    const positive = all.filter((r) => r.recommendation_type === "positive" || (r.rating || 0) >= 4);
    const reviews = positive
      .filter((r) => r.review_text && r.review_text.trim())
      .map((r) => ({
        author: r.reviewer?.name || "Facebook user",
        photo: r.reviewer?.picture?.data?.url || null,
        rating: r.rating || 5,
        text: r.review_text.trim(),
        time: r.created_time || null,
        recommends: r.recommendation_type !== "negative",
      }));

    return json(
      {
        configured: true,
        source: "facebook",
        name: page.name || "Reverb Merch",
        rating: page.overall_star_rating || null,
        total: page.rating_count || all.length,
        // Share of fetched recommendations that are positive (Facebook no
        // longer shows star averages for most Pages, only "% recommend").
        recommendPct: all.length ? Math.round((positive.length / all.length) * 100) : null,
        pageUri: page.link || `https://www.facebook.com/${pageId}`,
        reviewsUri: `${(page.link || `https://www.facebook.com/${pageId}`).replace(/\/$/, "")}/reviews`,
        reviews,
      },
      true
    );
  } catch (err) {
    return json({ configured: true, error: err.message });
  }
};

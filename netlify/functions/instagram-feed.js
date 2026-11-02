// Fetches recent Instagram posts for @reverbmerch.
// Environment variables (Netlify dashboard -> Site configuration ->
// Environment variables). Either option works:
//
// Option A (recommended, never expires) - Instagram linked to the Facebook Page:
//   META_PAGE_ACCESS_TOKEN - the same Page token used by facebook-reviews.js,
//                            with instagram_basic permission.
//   INSTAGRAM_USER_ID      - the Instagram Business Account ID. Optional if
//                            FACEBOOK_PAGE_ID is set: it's looked up from the Page.
//
// Option B - Instagram API with Instagram Login (no Facebook Page needed):
//   INSTAGRAM_ACCESS_TOKEN - long-lived Instagram user token. These expire
//                            after 60 days; this function refreshes it on use
//                            but cannot save the new one, so regenerate it in
//                            the Meta dashboard before it expires.
//
//   META_GRAPH_VERSION     - optional, defaults to v23.0.
// Setup steps are in DEVELOPER.md -> "Live Reviews & Instagram Feed".
const VERSION = () => process.env.META_GRAPH_VERSION || "v23.0";
const FIELDS = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count";

function json(body, cache) {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": cache ? "public, max-age=900" : "no-store",
      // Instagram media URLs are signed and expire after a few days, so the
      // CDN copy is kept short.
      ...(cache ? { "Netlify-CDN-Cache-Control": "public, durable, s-maxage=3600, stale-while-revalidate=21600" } : {}),
    },
    body: JSON.stringify(body),
  };
}

async function get(url) {
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) throw new Error(`Instagram API ${res.status}: ${data.error?.message || "request failed"}`);
  return data;
}

exports.handler = async function () {
  const pageToken = process.env.META_PAGE_ACCESS_TOKEN;
  const igToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  let userId = process.env.INSTAGRAM_USER_ID;
  const pageId = process.env.FACEBOOK_PAGE_ID;

  try {
    let url;
    if (pageToken && (userId || pageId)) {
      const base = `https://graph.facebook.com/${VERSION()}`;
      const t = encodeURIComponent(pageToken);
      if (!userId) {
        const page = await get(`${base}/${pageId}?fields=instagram_business_account&access_token=${t}`);
        userId = page.instagram_business_account?.id;
        if (!userId) return json({ configured: true, error: "Facebook Page has no linked Instagram business account" });
      }
      url = `${base}/${userId}/media?fields=${FIELDS}&limit=12&access_token=${t}`;
    } else if (igToken && userId) {
      // Legacy setup: Graph API with a user token and explicit account ID.
      url = `https://graph.facebook.com/${VERSION()}/${userId}/media?fields=${FIELDS}&limit=12&access_token=${encodeURIComponent(igToken)}`;
    } else if (igToken) {
      // Instagram Login token: extend its life on use (best effort).
      fetch(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(igToken)}`).catch(() => {});
      url = `https://graph.instagram.com/${VERSION()}/me/media?fields=${FIELDS}&limit=12&access_token=${encodeURIComponent(igToken)}`;
    } else {
      return json({ configured: false });
    }

    const data = await get(url);
    const posts = (data.data || [])
      .filter((p) => p.media_type !== "VIDEO" || p.thumbnail_url)
      .slice(0, 9)
      .map((p) => ({
        id: p.id,
        type: p.media_type,
        image: p.media_type === "VIDEO" ? p.thumbnail_url : p.media_url,
        permalink: p.permalink,
        caption: (p.caption || "").slice(0, 140),
        likes: typeof p.like_count === "number" ? p.like_count : null,
        comments: typeof p.comments_count === "number" ? p.comments_count : null,
        time: p.timestamp || null,
      }));

    return json({ configured: true, posts }, true);
  } catch (err) {
    return json({ configured: true, error: err.message });
  }
};

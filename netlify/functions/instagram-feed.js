// Fetches recent Instagram posts via the Instagram Graph API.
// Requires two environment variables set in the Netlify dashboard
// (Site configuration -> Environment variables):
//   INSTAGRAM_ACCESS_TOKEN  - a long-lived access token for the linked
//                             Instagram Business/Creator account
//   INSTAGRAM_USER_ID       - the Instagram Business Account ID
// The token stays server-side here and is never exposed to the browser.
//
// Setup (one-time, on Meta's side):
//   1. Convert the Instagram account to a Business or Creator account
//      and link it to a Facebook Page.
//   2. Create a Meta Developer App at developers.facebook.com, add the
//      "Instagram Graph API" product.
//   3. Generate a long-lived access token for the linked IG account
//      (Graph API Explorer -> exchange short-lived for long-lived token).
//   4. Long-lived tokens expire after ~60 days and must be refreshed
//      before then via the /refresh_access_token endpoint - set a
//      reminder, or extend this function to auto-refresh and store the
//      new token (requires a persistence layer, out of scope for now).

exports.handler = async function () {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  const userId = process.env.INSTAGRAM_USER_ID;

  if (!token || !userId) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      body: JSON.stringify({ configured: false }),
    };
  }

  try {
    const fields = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp";
    const url = `https://graph.facebook.com/v19.0/${userId}/media?fields=${fields}&limit=9&access_token=${token}`;
    const res = await fetch(url);

    if (!res.ok) {
      const errText = await res.text();
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
        body: JSON.stringify({ configured: true, error: `Instagram API error ${res.status}`, detail: errText }),
      };
    }

    const data = await res.json();
    const posts = (data.data || [])
      .filter((p) => p.media_type !== "VIDEO" || p.thumbnail_url)
      .map((p) => ({
        id: p.id,
        image: p.media_type === "VIDEO" ? p.thumbnail_url : p.media_url,
        permalink: p.permalink,
        caption: (p.caption || "").slice(0, 120),
      }));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=3600" },
      body: JSON.stringify({ configured: true, posts }),
    };
  } catch (err) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      body: JSON.stringify({ configured: true, error: err.message }),
    };
  }
};

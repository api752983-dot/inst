import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json()

    if (!username) {
      return NextResponse.json({ success: false, error: "Username is required" }, { status: 400 })
    }

    const apiUrl = "https://instagram120.p.rapidapi.com/api/instagram/posts"

    console.log("[v0] Fetching Instagram posts for:", username)

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "x-rapidapi-key": process.env.INSTAGRAM_API_KEY || "",
        "x-rapidapi-host": "instagram120.p.rapidapi.com",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username,
        maxId: "",
      }),
      cache: "no-store",
    })

    if (!response.ok) {
      console.error("[v0] Instagram Posts API error:", response.status, response.statusText)
      return NextResponse.json(
        {
          success: false,
          error: `Instagram API error: ${response.statusText}`,
        },
        { status: response.status },
      )
    }

    const data = await response.json()

    console.log("[v0] Instagram posts API raw response:", JSON.stringify(data, null, 2))

    // Ensure we have an array of posts
    const posts = Array.isArray(data) ? data : data.posts || data.data || []

    return NextResponse.json({
      success: true,
      posts: posts.map((post: any) => ({
        id: post.id || post.pk || "",
        caption: post.caption || post.text || "",
        timestamp: post.timestamp || post.taken_at || null,
        media_type: post.media_type || post.type || "image",
        media_url: post.media_url || post.image_url || post.images?.[0] || "",
        like_count: Math.max(0, Number.parseInt(post.like_count || post.likes || "0")),
        comment_count: Math.max(0, Number.parseInt(post.comment_count || post.comments || "0")),
        raw_data: post,
      })),
      raw_response: data,
    })
  } catch (error: any) {
    console.error("[v0] Error fetching Instagram posts:", error.message || error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch Instagram posts",
      },
      { status: 500 },
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}

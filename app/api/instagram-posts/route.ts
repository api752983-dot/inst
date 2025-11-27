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
        "x-rapidapi-key": "58476d898amsh61d6476db2514cfp114ab2jsn8e290bed9186",
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

    if (data.success === false || data.response_type === "private page") {
      return NextResponse.json({
        success: false,
        error: data.message || "This page is private",
        posts: [],
      })
    }

    const items = data.data?.items || []

    return NextResponse.json({
      success: true,
      posts: items.map((post: any) => ({
        id: post.id || post.pk || "",
        caption: post.caption?.text || "",
        timestamp: post.taken_at || null,
        media_type: post.media_type || 1,
        media_url: post.image_versions?.items?.[0]?.url || post.thumbnail_url || "",
        like_count: post.like_count || 0,
        comment_count: post.comment_count || 0,
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

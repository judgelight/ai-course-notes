import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // 从URL参数中获取图片URL
  const url = request.nextUrl.searchParams.get('url')
  
  if (!url) {
    return new NextResponse('Missing URL parameter', { status: 400 })
  }

  try {
    // 从原始URL获取图片
    const response = await fetch(url)
    
    if (!response.ok) {
      return new NextResponse('Failed to fetch image', { status: response.status })
    }

    // 获取图片数据
    const imageBuffer = await response.arrayBuffer()
    
    // 获取内容类型
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    
    // 返回图片数据，并设置适当的头信息
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (error) {
    console.error('Error proxying image:', error)
    return new NextResponse('Error proxying image', { status: 500 })
  }
}

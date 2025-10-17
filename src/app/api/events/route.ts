import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const prefecture = searchParams.get('prefecture')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sortBy = searchParams.get('sortBy') || 'eventDate'

    const where: any = {}
    
    if (prefecture) {
      where.prefecture = prefecture
    }

    let orderBy: any = {}
    
    switch (sortBy) {
      case 'eventDate':
        orderBy = { eventDate: 'asc' }
        break
      case 'createdAt':
        orderBy = { createdAt: 'desc' }
        break
      default:
        orderBy = { eventDate: 'asc' }
    }

    const events = await prisma.event.findMany({
      where,
      orderBy,
      take: limit,
    })

    return NextResponse.json({
      events,
      total: events.length,
    })
  } catch (error) {
    console.error('Get events error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 管理者用: イベント情報を作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const event = await prisma.event.create({
      data: {
        title: body.title,
        description: body.description,
        location: body.location,
        prefecture: body.prefecture,
        eventDate: new Date(body.eventDate),
        endDate: body.endDate ? new Date(body.endDate) : null,
        fee: body.fee,
        website: body.website,
        contact: body.contact,
      },
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error('Create event error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
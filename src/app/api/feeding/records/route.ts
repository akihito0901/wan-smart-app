import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import type { Session } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const createFeedingRecordSchema = z.object({
  dailyAmount: z.number().positive(),
  foodType: z.enum(['dry', 'wet']),
})

// 給餌記録を作成
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { dailyAmount, foodType } = createFeedingRecordSchema.parse(body)

    const feedingRecord = await prisma.feedingRecord.create({
      data: {
        dailyAmount,
        foodType,
        userId: session.user.id,
      },
    })

    return NextResponse.json(feedingRecord, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Create feeding record error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 給餌記録を取得
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    const feedingRecords = await prisma.feedingRecord.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        calculatedAt: 'desc',
      },
      take: limit,
      skip: offset,
    })

    const total = await prisma.feedingRecord.count({
      where: {
        userId: session.user.id,
      },
    })

    return NextResponse.json({
      records: feedingRecords,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    console.error('Get feeding records error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
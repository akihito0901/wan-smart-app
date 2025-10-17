import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') // puppy, adult, senior
    const type = searchParams.get('type') // dry, wet
    const limit = parseInt(searchParams.get('limit') || '10')
    const sortBy = searchParams.get('sortBy') || 'rating' // rating, reviewCount, price

    const where: { category?: string; type?: string } = {}
    
    if (category) {
      where.category = category
    }
    
    if (type) {
      where.type = type
    }

    let orderBy: { rating?: 'asc' | 'desc'; reviewCount?: 'asc' | 'desc'; price?: 'asc' | 'desc' } = {}
    
    switch (sortBy) {
      case 'rating':
        orderBy = { rating: 'desc' }
        break
      case 'reviewCount':
        orderBy = { reviewCount: 'desc' }
        break
      case 'price':
        orderBy = { price: 'asc' }
        break
      default:
        orderBy = { rating: 'desc' }
    }

    const foods = await prisma.food.findMany({
      where,
      orderBy,
      take: limit,
    })

    return NextResponse.json({
      foods,
      total: foods.length,
    })
  } catch (error) {
    console.error('Get foods error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 管理者用: フード情報を作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const food = await prisma.food.create({
      data: {
        name: body.name,
        manufacturer: body.manufacturer,
        category: body.category,
        type: body.type,
        price: body.price,
        rating: body.rating || 0,
        reviewCount: body.reviewCount || 0,
        protein: body.protein,
        fat: body.fat,
        fiber: body.fiber,
        description: body.description,
        imageUrl: body.imageUrl,
      },
    })

    return NextResponse.json(food, { status: 201 })
  } catch (error) {
    console.error('Create food error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createVaccineRecordSchema = z.object({
  vaccineName: z.string().min(1),
  vaccinatedAt: z.string().transform((str) => new Date(str)),
  nextDueDate: z.string().optional().transform((str) => str ? new Date(str) : null),
  veterinary: z.string().optional(),
  memo: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const records = await prisma.vaccineRecord.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        vaccinatedAt: 'desc',
      },
    })

    return NextResponse.json({
      records,
      total: records.length,
    })
  } catch (error) {
    console.error('Get vaccine records error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { vaccineName, vaccinatedAt, nextDueDate, veterinary, memo } = createVaccineRecordSchema.parse(body)

    const record = await prisma.vaccineRecord.create({
      data: {
        vaccineName,
        vaccinatedAt,
        nextDueDate,
        veterinary,
        memo,
        userId: session.user.id,
      },
    })

    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create vaccine record error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
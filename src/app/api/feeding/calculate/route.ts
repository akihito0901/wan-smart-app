import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const calculateFeedingSchema = z.object({
  weight: z.number().positive(),
  age: z.number().int().positive(),
  activityLevel: z.enum(['low', 'medium', 'high']),
  foodType: z.enum(['dry', 'wet']),
  spayedNeutered: z.boolean().optional().default(false),
})

// 犬の給餌量計算式
// 基礎代謝量 (RER) = 70 × (体重kg)^0.75
// 必要カロリー = RER × 活動係数
function calculateDailyCalories(weight: number, age: number, activityLevel: string, spayedNeutered: boolean) {
  // 基礎代謝量 (Resting Energy Requirement)
  const rer = 70 * Math.pow(weight, 0.75)
  
  // 活動係数
  let activityFactor = 1.0
  
  // 年齢による調整
  if (age < 4) {
    // 子犬 (生後4ヶ月未満)
    activityFactor = 3.0
  } else if (age < 12) {
    // 若い犬 (4-12ヶ月)
    activityFactor = 2.0
  } else {
    // 成犬
    switch (activityLevel) {
      case 'low':
        activityFactor = spayedNeutered ? 1.6 : 1.8
        break
      case 'medium':
        activityFactor = spayedNeutered ? 1.8 : 2.0
        break
      case 'high':
        activityFactor = spayedNeutered ? 2.0 : 2.2
        break
    }
  }
  
  // シニア犬の調整 (7歳以上)
  if (age >= 84) { // 7年 = 84ヶ月
    activityFactor *= 0.8
  }
  
  return rer * activityFactor
}

// フードの種類によるカロリー密度 (kcal/g)
const foodCalories = {
  dry: 3.5,  // ドライフード: 約3.5kcal/g
  wet: 1.0,  // ウェットフード: 約1.0kcal/g
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { weight, age, activityLevel, foodType, spayedNeutered } = calculateFeedingSchema.parse(body)

    // 1日の必要カロリーを計算
    const dailyCalories = calculateDailyCalories(weight, age, activityLevel, spayedNeutered)
    
    // フードの量を計算 (グラム)
    const dailyAmount = dailyCalories / foodCalories[foodType]
    
    // 1回あたりの量 (1日2回給餌を想定)
    const perMealAmount = dailyAmount / 2
    
    // 計算結果をわかりやすい形で返す
    const result = {
      dailyCalories: Math.round(dailyCalories),
      dailyAmount: Math.round(dailyAmount * 10) / 10, // 小数点1桁
      perMealAmount: Math.round(perMealAmount * 10) / 10,
      foodType,
      recommendations: {
        feedingTimes: 2,
        notes: [
          '計算結果は目安です。愛犬の体調や体型を観察して調整してください。',
          '急激な食事量の変更は避け、徐々に調整してください。',
          '獣医師の指導がある場合は、そちらを優先してください。'
        ]
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Feeding calculation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
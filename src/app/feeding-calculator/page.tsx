'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Navigation } from '@/components/layout/navigation'
import { Calculator, Info, AlertCircle } from 'lucide-react'

interface CalculationResult {
  dailyCalories: number
  dailyAmount: number
  perMealAmount: number
  foodType: string
  recommendations: {
    feedingTimes: number
    notes: string[]
  }
}

export default function FeedingCalculator() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<CalculationResult | null>(null)
  const [error, setError] = useState('')

  // フォームデータ
  const [weight, setWeight] = useState('')
  const [age, setAge] = useState('')
  const [activityLevel, setActivityLevel] = useState('medium')
  const [foodType, setFoodType] = useState('dry')
  const [spayedNeutered, setSpayedNeutered] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
    }
  }, [session, status, router])

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/feeding/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weight: parseFloat(weight),
          age: parseInt(age),
          activityLevel,
          foodType,
          spayedNeutered,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || '計算に失敗しました')
      } else {
        setResult(data)
      }
    } catch {
      setError('計算に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setWeight('')
    setAge('')
    setActivityLevel('medium')
    setFoodType('dry')
    setSpayedNeutered(false)
    setResult(null)
    setError('')
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <Calculator className="h-6 w-6 text-indigo-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">給餌量チェッカー</h1>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              愛犬の基本情報を入力して、最適な給餌量を計算しましょう
            </p>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                {error}
              </div>
            )}

            <form onSubmit={handleCalculate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-2">
                    体重 (kg) *
                  </label>
                  <input
                    type="number"
                    id="weight"
                    step="0.1"
                    min="0.1"
                    max="100"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="例: 5.2"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
                    年齢 (ヶ月) *
                  </label>
                  <input
                    type="number"
                    id="age"
                    min="1"
                    max="300"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="例: 24 (2歳)"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="activityLevel" className="block text-sm font-medium text-gray-700 mb-2">
                    活動量 *
                  </label>
                  <select
                    id="activityLevel"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={activityLevel}
                    onChange={(e) => setActivityLevel(e.target.value)}
                  >
                    <option value="low">低い（室内犬、散歩少なめ）</option>
                    <option value="medium">普通（毎日の散歩）</option>
                    <option value="high">高い（運動量多め、活発）</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="foodType" className="block text-sm font-medium text-gray-700 mb-2">
                    フードの種類 *
                  </label>
                  <select
                    id="foodType"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={foodType}
                    onChange={(e) => setFoodType(e.target.value)}
                  >
                    <option value="dry">ドライフード</option>
                    <option value="wet">ウェットフード</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="spayedNeutered"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  checked={spayedNeutered}
                  onChange={(e) => setSpayedNeutered(e.target.checked)}
                />
                <label htmlFor="spayedNeutered" className="ml-2 block text-sm text-gray-700">
                  避妊・去勢手術済み
                </label>
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50"
                >
                  {isLoading ? '計算中...' : '給餌量を計算'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  リセット
                </button>
              </div>
            </form>

            {result && (
              <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-800 mb-4">計算結果</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="text-2xl font-bold text-indigo-600">{result.dailyCalories}</div>
                    <div className="text-sm text-gray-600">1日の必要カロリー (kcal)</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="text-2xl font-bold text-indigo-600">{result.dailyAmount}g</div>
                    <div className="text-sm text-gray-600">1日の給餌量</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="text-2xl font-bold text-indigo-600">{result.perMealAmount}g</div>
                    <div className="text-sm text-gray-600">1回あたりの量 (2回給餌)</div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <Info className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-800 mb-2">注意事項</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        {result.recommendations.notes.map((note, index) => (
                          <li key={index}>• {note}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
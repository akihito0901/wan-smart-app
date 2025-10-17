'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Navigation } from '@/components/layout/navigation'
import { Trophy, Star, Package, DollarSign, Filter } from 'lucide-react'

interface Food {
  id: string
  name: string
  manufacturer: string
  category: string
  type: string
  price: number | null
  rating: number
  reviewCount: number
  protein: number | null
  fat: number | null
  fiber: number | null
  description: string | null
  imageUrl: string | null
}

interface FoodsResponse {
  foods: Food[]
  total: number
}

export default function FoodRanking() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [foods, setFoods] = useState<Food[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // フィルター状態
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [sortBy, setSortBy] = useState('rating')

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
    }
  }, [session, status, router])

  const fetchFoods = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams({
        limit: '20',
        sortBy,
      })

      if (selectedCategory) {
        params.append('category', selectedCategory)
      }

      if (selectedType) {
        params.append('type', selectedType)
      }

      const response = await fetch(`/api/foods?${params}`)
      const data: FoodsResponse = await response.json()

      if (!response.ok) {
        setError('フード情報の取得に失敗しました')
      } else {
        setFoods(data.foods)
      }
    } catch {
      setError('フード情報の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [selectedCategory, selectedType, sortBy])

  useEffect(() => {
    if (session) {
      fetchFoods()
    }
  }, [session, fetchFoods])

  const getRankingIcon = (index: number) => {
    if (index === 0) return '🥇'
    if (index === 1) return '🥈'
    if (index === 2) return '🥉'
    return `${index + 1}`
  }

  const formatPrice = (price: number | null) => {
    if (!price) return '価格不明'
    return `¥${price.toLocaleString()}`
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'puppy': return '子犬用'
      case 'adult': return '成犬用'
      case 'senior': return 'シニア用'
      default: return category
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'dry': return 'ドライフード'
      case 'wet': return 'ウェットフード'
      default: return type
    }
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
      
      <main className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <Trophy className="h-6 w-6 text-yellow-500 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">フードランキング</h1>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              人気ドッグフードのランキングと詳細情報
            </p>
          </div>

          <div className="p-6">
            {/* フィルター */}
            <div className="mb-6 bg-gray-50 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Filter className="h-5 w-5 text-gray-600 mr-2" />
                <h3 className="font-medium text-gray-900">フィルター</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    カテゴリー
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="">すべて</option>
                    <option value="puppy">子犬用</option>
                    <option value="adult">成犬用</option>
                    <option value="senior">シニア用</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    フードタイプ
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                  >
                    <option value="">すべて</option>
                    <option value="dry">ドライフード</option>
                    <option value="wet">ウェットフード</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    並び順
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="rating">評価順</option>
                    <option value="reviewCount">レビュー数順</option>
                    <option value="price">価格順</option>
                  </select>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {loading ? (
              <div className="text-center py-8">
                <div className="text-lg">読み込み中...</div>
              </div>
            ) : foods.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <div className="text-gray-500">フード情報がありません</div>
                <div className="text-sm text-gray-400 mt-2">
                  フィルター条件を変更してみてください
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {foods.map((food, index) => (
                  <div key={food.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center text-lg font-bold text-yellow-600">
                          {getRankingIcon(index)}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {food.name}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              {food.manufacturer}
                            </p>
                            
                            <div className="flex items-center space-x-4 mb-2">
                              <div className="flex items-center">
                                <Star className="h-4 w-4 text-yellow-400 mr-1" />
                                <span className="text-sm font-medium">{food.rating}</span>
                                <span className="text-sm text-gray-500 ml-1">
                                  ({food.reviewCount} レビュー)
                                </span>
                              </div>
                              
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {getCategoryLabel(food.category)}
                              </span>
                              
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {getTypeLabel(food.type)}
                              </span>
                            </div>

                            {food.description && (
                              <p className="text-sm text-gray-600 mb-3">
                                {food.description}
                              </p>
                            )}

                            {(food.protein || food.fat || food.fiber) && (
                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                {food.protein && <span>タンパク質: {food.protein}%</span>}
                                {food.fat && <span>脂質: {food.fat}%</span>}
                                {food.fiber && <span>繊維: {food.fiber}%</span>}
                              </div>
                            )}
                          </div>

                          <div className="text-right">
                            <div className="flex items-center text-lg font-semibold text-gray-900">
                              <DollarSign className="h-5 w-5 mr-1" />
                              {formatPrice(food.price)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
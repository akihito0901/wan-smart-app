'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Navigation } from '@/components/layout/navigation'
import { Calendar, MapPin, DollarSign, ExternalLink, Filter, Clock } from 'lucide-react'

interface Event {
  id: string
  title: string
  description: string | null
  location: string
  prefecture: string
  eventDate: string
  endDate: string | null
  fee: string | null
  website: string | null
  contact: string | null
  createdAt: string
  updatedAt: string
}

interface EventsResponse {
  events: Event[]
  total: number
}

const prefectures = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
]

export default function Events() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // フィルター状態
  const [selectedPrefecture, setSelectedPrefecture] = useState('')
  const [sortBy, setSortBy] = useState('eventDate')

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
    }
  }, [session, status, router])

  useEffect(() => {
    if (session) {
      fetchEvents()
    }
  }, [session, selectedPrefecture, sortBy])

  const fetchEvents = async () => {
    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams({
        limit: '50',
        sortBy,
      })

      if (selectedPrefecture) {
        params.append('prefecture', selectedPrefecture)
      }

      const response = await fetch(`/api/events?${params}`)
      const data: EventsResponse = await response.json()

      if (!response.ok) {
        setError('イベント情報の取得に失敗しました')
      } else {
        setEvents(data.events)
      }
    } catch (error) {
      setError('イベント情報の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isUpcoming = (eventDate: string) => {
    return new Date(eventDate) >= new Date()
  }

  const isPast = (eventDate: string) => {
    return new Date(eventDate) < new Date()
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
              <Calendar className="h-6 w-6 text-purple-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">イベント情報</h1>
                <p className="mt-1 text-sm text-gray-600">
                  全国の犬関連イベントを探してみましょう
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* フィルター */}
            <div className="mb-6 bg-gray-50 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Filter className="h-5 w-5 text-gray-600 mr-2" />
                <h3 className="font-medium text-gray-900">フィルター</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    都道府県
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={selectedPrefecture}
                    onChange={(e) => setSelectedPrefecture(e.target.value)}
                  >
                    <option value="">すべて</option>
                    {prefectures.map((prefecture) => (
                      <option key={prefecture} value={prefecture}>
                        {prefecture}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    並び順
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="eventDate">開催日順</option>
                    <option value="createdAt">投稿日順</option>
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
            ) : events.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <div className="text-gray-500">イベント情報がありません</div>
                <div className="text-sm text-gray-400 mt-2">
                  フィルター条件を変更してみてください
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((event) => (
                  <div 
                    key={event.id} 
                    className={`border rounded-lg p-6 transition-shadow hover:shadow-md ${
                      isPast(event.eventDate) ? 'border-gray-200 bg-gray-50' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className={`text-lg font-semibold ${
                            isPast(event.eventDate) ? 'text-gray-600' : 'text-gray-900'
                          }`}>
                            {event.title}
                            {isPast(event.eventDate) && (
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                終了
                              </span>
                            )}
                            {isUpcoming(event.eventDate) && (
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                開催予定
                              </span>
                            )}
                          </h3>
                        </div>

                        <div className="space-y-2 text-sm text-gray-600 mb-4">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span>
                              {formatDate(event.eventDate)}
                              {event.endDate && event.endDate !== event.eventDate && (
                                <span> 〜 {formatDate(event.endDate)}</span>
                              )}
                            </span>
                          </div>
                          
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2" />
                            <span>{event.prefecture} {event.location}</span>
                          </div>

                          {event.fee && (
                            <div className="flex items-center">
                              <DollarSign className="h-4 w-4 mr-2" />
                              <span>{event.fee}</span>
                            </div>
                          )}
                        </div>

                        {event.description && (
                          <p className={`text-sm mb-4 ${
                            isPast(event.eventDate) ? 'text-gray-500' : 'text-gray-600'
                          }`}>
                            {event.description}
                          </p>
                        )}

                        <div className="flex items-center space-x-4">
                          {event.website && (
                            <a
                              href={event.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-sm text-purple-600 hover:text-purple-700"
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              公式サイト
                            </a>
                          )}
                          {event.contact && (
                            <div className="text-sm text-gray-500">
                              お問い合わせ: {event.contact}
                            </div>
                          )}
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
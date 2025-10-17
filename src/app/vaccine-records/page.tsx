'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Navigation } from '@/components/layout/navigation'
import { Shield, Plus, Calendar, FileText, AlertCircle, Edit, Trash2 } from 'lucide-react'

interface VaccineRecord {
  id: string
  vaccineName: string
  vaccinatedAt: string
  nextDueDate: string | null
  veterinary: string | null
  memo: string | null
  certificateUrl: string | null
  createdAt: string
  updatedAt: string
}

interface VaccineRecordsResponse {
  records: VaccineRecord[]
  total: number
}

export default function VaccineRecords() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [records, setRecords] = useState<VaccineRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  // フォームデータ
  const [formData, setFormData] = useState({
    vaccineName: '',
    vaccinatedAt: '',
    nextDueDate: '',
    veterinary: '',
    memo: ''
  })

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
    }
  }, [session, status, router])

  useEffect(() => {
    if (session) {
      fetchRecords()
    }
  }, [session])

  const fetchRecords = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/vaccine-records')
      const data: VaccineRecordsResponse = await response.json()

      if (!response.ok) {
        setError('ワクチン記録の取得に失敗しました')
      } else {
        setRecords(data.records)
      }
    } catch (error) {
      setError('ワクチン記録の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/vaccine-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          vaccinatedAt: new Date(formData.vaccinatedAt).toISOString(),
          nextDueDate: formData.nextDueDate ? new Date(formData.nextDueDate).toISOString() : null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'ワクチン記録の登録に失敗しました')
      } else {
        setFormData({
          vaccineName: '',
          vaccinatedAt: '',
          nextDueDate: '',
          veterinary: '',
          memo: ''
        })
        setShowAddForm(false)
        fetchRecords()
      }
    } catch (error) {
      setError('ワクチン記録の登録に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP')
  }

  const getDaysUntilDue = (dueDateString: string) => {
    const today = new Date()
    const dueDate = new Date(dueDateString)
    const diffTime = dueDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getStatusColor = (dueDateString: string | null) => {
    if (!dueDateString) return 'text-gray-500'
    
    const daysUntil = getDaysUntilDue(dueDateString)
    if (daysUntil < 0) return 'text-red-600'
    if (daysUntil <= 30) return 'text-orange-600'
    return 'text-green-600'
  }

  const getStatusMessage = (dueDateString: string | null) => {
    if (!dueDateString) return '次回予定日未設定'
    
    const daysUntil = getDaysUntilDue(dueDateString)
    if (daysUntil < 0) return `${Math.abs(daysUntil)}日超過`
    if (daysUntil === 0) return '本日が予定日'
    if (daysUntil <= 30) return `あと${daysUntil}日`
    return `あと${daysUntil}日`
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
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Shield className="h-6 w-6 text-green-600 mr-3" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">ワクチン記録</h1>
                  <p className="mt-1 text-sm text-gray-600">
                    愛犬のワクチン接種記録を管理しましょう
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                記録を追加
              </button>
            </div>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                {error}
              </div>
            )}

            {/* 追加フォーム */}
            {showAddForm && (
              <div className="mb-6 bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">新しいワクチン記録</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ワクチン名 *
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="例: 5種混合ワクチン"
                        value={formData.vaccineName}
                        onChange={(e) => setFormData({ ...formData, vaccineName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        接種日 *
                      </label>
                      <input
                        type="date"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        value={formData.vaccinatedAt}
                        onChange={(e) => setFormData({ ...formData, vaccinatedAt: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        次回予定日
                      </label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        value={formData.nextDueDate}
                        onChange={(e) => setFormData({ ...formData, nextDueDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        動物病院名
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="例: ○○動物病院"
                        value={formData.veterinary}
                        onChange={(e) => setFormData({ ...formData, veterinary: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      メモ
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="任意のメモや注意事項"
                      value={formData.memo}
                      onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                    >
                      {loading ? '登録中...' : '登録'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    >
                      キャンセル
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 記録一覧 */}
            {loading && !showAddForm ? (
              <div className="text-center py-8">
                <div className="text-lg">読み込み中...</div>
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <div className="text-gray-500">ワクチン記録がありません</div>
                <div className="text-sm text-gray-400 mt-2">
                  最初のワクチン記録を追加してみましょう
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {records.map((record) => (
                  <div key={record.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {record.vaccineName}
                          </h3>
                          {record.nextDueDate && (
                            <span className={`ml-3 text-sm font-medium ${getStatusColor(record.nextDueDate)}`}>
                              {getStatusMessage(record.nextDueDate)}
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            接種日: {formatDate(record.vaccinatedAt)}
                          </div>
                          {record.nextDueDate && (
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2" />
                              次回予定: {formatDate(record.nextDueDate)}
                            </div>
                          )}
                          {record.veterinary && (
                            <div className="flex items-center">
                              <FileText className="h-4 w-4 mr-2" />
                              {record.veterinary}
                            </div>
                          )}
                        </div>

                        {record.memo && (
                          <div className="mt-3 text-sm text-gray-600">
                            <p>メモ: {record.memo}</p>
                          </div>
                        )}
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
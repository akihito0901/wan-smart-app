'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { Navigation } from '@/components/layout/navigation'
import { 
  Calculator, 
  Trophy, 
  Shield, 
  Calendar,
  PlusCircle,
  BarChart3
} from 'lucide-react'

const features = [
  {
    name: '給餌量チェッカー',
    description: '愛犬の体重・年齢・活動量から最適な給餌量を計算',
    href: '/feeding-calculator',
    icon: Calculator,
    color: 'bg-blue-500'
  },
  {
    name: 'フードランキング',
    description: '人気フードのランキングと詳細情報',
    href: '/food-ranking',
    icon: Trophy,
    color: 'bg-yellow-500'
  },
  {
    name: 'ワクチン記録',
    description: '接種履歴の管理と次回予定日の確認',
    href: '/vaccine-records',
    icon: Shield,
    color: 'bg-green-500'
  },
  {
    name: 'イベント情報',
    description: '全国の犬関連イベント情報',
    href: '/events',
    icon: Calendar,
    color: 'bg-purple-500'
  }
]

const quickActions = [
  {
    name: '愛犬情報を登録',
    description: '犬の基本情報を登録しましょう',
    href: '/dog/register',
    icon: PlusCircle,
    color: 'bg-indigo-500'
  },
  {
    name: '健康記録を追加',
    description: '今日の健康状態を記録',
    href: '/health-records/new',
    icon: BarChart3,
    color: 'bg-pink-500'
  }
]

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
    }
  }, [session, status, router])

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
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              こんにちは、{session.user?.name || 'ユーザー'}さん！
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              愛犬の健康管理をサポートします
            </p>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">クイックアクション</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {quickActions.map((action) => (
              <Link
                key={action.name}
                href={action.href}
                className="relative block p-6 bg-white rounded-lg border border-gray-300 hover:border-gray-400 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center">
                  <div className={`flex-shrink-0 ${action.color} rounded-md p-3`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-medium text-gray-900">
                      {action.name}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {action.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">主な機能</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Link
                key={feature.name}
                href={feature.href}
                className="relative block p-6 bg-white rounded-lg border border-gray-300 hover:border-gray-400 hover:shadow-md transition-all duration-200"
              >
                <div>
                  <div className={`inline-flex p-3 rounded-lg ${feature.color}`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="mt-4">
                  <h4 className="text-lg font-medium text-gray-900">
                    {feature.name}
                  </h4>
                  <p className="mt-2 text-sm text-gray-500">
                    {feature.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
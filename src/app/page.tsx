'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { 
  Calculator, 
  Trophy, 
  Shield, 
  Calendar,
  Heart,
  CheckCircle
} from 'lucide-react'

const features = [
  {
    icon: Calculator,
    title: '給餌量チェッカー',
    description: '愛犬の体重・年齢・活動量から最適な給餌量を自動計算'
  },
  {
    icon: Trophy,
    title: 'フードランキング',
    description: '人気フードTOP10と詳細な評価・レビュー'
  },
  {
    icon: Shield,
    title: 'ワクチン記録',
    description: '接種履歴の管理と次回予定日の自動リマインド'
  },
  {
    icon: Calendar,
    title: 'イベント情報',
    description: '全国の犬関連イベント・ドッグランなどの情報'
  }
]

const benefits = [
  '愛犬の健康管理が簡単に',
  '科学的根拠に基づいた給餌量計算',
  '信頼できるフード情報',
  'ワクチン接種の忘れ防止'
]

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session) {
      router.push('/dashboard')
    }
  }, [session, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    )
  }

  if (session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-indigo-600">🐕 わんスマート</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/auth/signin"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                ログイン
              </Link>
              <Link
                href="/auth/signup"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                新規登録
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-6">
            愛犬の健康管理を
            <span className="text-indigo-600 block">もっとスマートに</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            給餌量の計算からワクチン記録まで、愛犬の健康管理に必要な機能をすべて一つのアプリに。
            科学的根拠に基づいた情報で、愛犬との生活をより豊かにサポートします。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors"
            >
              無料で始める
            </Link>
            <Link
              href="/auth/signin"
              className="border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 font-bold py-3 px-8 rounded-lg text-lg transition-colors"
            >
              ログイン
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
              主な機能
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              愛犬の健康管理に必要な機能を厳選してお届けします
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-8 w-8 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900 mb-6">
                なぜわんスマートを選ぶのか？
              </h2>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
                    <span className="text-lg text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-center">
              <div className="bg-white rounded-lg shadow-lg p-8">
                <Heart className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  愛犬との絆を深める
                </h3>
                <p className="text-gray-600">
                  適切な健康管理で愛犬との時間をより長く、より幸せに過ごしましょう。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-indigo-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white mb-4">
            今すぐ始めましょう
          </h2>
          <p className="text-xl text-indigo-200 mb-8">
            無料で登録して、愛犬の健康管理をスタートしませんか？
          </p>
          <Link
            href="/auth/signup"
            className="bg-white hover:bg-gray-100 text-indigo-600 font-bold py-3 px-8 rounded-lg text-lg transition-colors"
          >
            無料で始める
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-2xl font-bold mb-4">🐕 わんスマート</div>
            <p className="text-gray-400">
              愛犬の健康管理をサポートするWebアプリケーション
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

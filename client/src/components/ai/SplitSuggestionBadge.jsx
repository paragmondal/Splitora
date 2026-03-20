import { useEffect, useRef, useState } from 'react'
import { useSplitSuggestion } from '../../hooks/useAI'

export default function SplitSuggestionBadge({ groupId, expenseTitle, amount }) {
  const { mutate, data, isPending, reset } = useSplitSuggestion()
  const timerRef = useRef(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!groupId || !expenseTitle || !amount || Number(amount) <= 0) { setShow(false); reset(); return }
    setShow(true)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => mutate({ groupId, expenseTitle, amount: Number(amount) }), 600)
    return () => clearTimeout(timerRef.current)
  }, [groupId, expenseTitle, amount, mutate, reset])

  if (!show) return null

  const suggestion = data?.data
  const confidenceColor = suggestion?.confidence === 'high' ? 'text-success-600 bg-success-50' : suggestion?.confidence === 'medium' ? 'text-warning-600 bg-warning-50' : 'text-surface-600 bg-surface-100'

  return (
    <div className={`mt-1 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium ${confidenceColor}`}>
      <span>✨</span>
      {isPending ? 'AI thinking...' : suggestion ? `AI suggests: ${suggestion.suggestedSplit} split — ${suggestion.reasoning}` : null}
    </div>
  )
}

import type { ChangeEventHandler } from 'react'
import { Input } from '@/components/ui/input'

import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { useState } from 'react'

export function TimePicker({
  time,
  onTimeChange,
  className,
  labelName,
}: {
  time: [number, number]
  onTimeChange: (time: [number, number]) => void
  className?: string
  labelName: string
}) {
  const [timeValue, setTimeValue] = useState<string>(`${time[0].toString().padStart(2, '0')}:${time[1].toString().padStart(2, '0')}`)

  const handleTimeChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const time = e.target.value
    setTimeValue(time)
    onTimeChange(time.split(':').map(str => Number.parseInt(str, 10)) as [number, number])
  }

  return (
    <Label className={cn('flex gap-2 items-center', className)}>
      <div className="shrink-0">{labelName}</div>
      <Input className="grow" type="time" value={timeValue} onChange={handleTimeChange} />
    </Label>
  )
}

import type { ChangeEventHandler } from 'react'
import { Calendar } from '@/components/ui/calendar'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { format, setHours, setMinutes, setSeconds } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from './ui/button'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'

export function DateTimePicker({
  dateTime,
  onDateTimeChange,
}: {
  dateTime: Date
  onDateTimeChange: (date: Date) => void
}) {
  dateTime.setSeconds(0);
  const [timeValue, setTimeValue] = useState<string>(
    format(dateTime, 'HH:mm:00')
  )

  const handleTimeChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const time = e.target.value

    const [hours, minutes] = time.split(':').map(str => Number.parseInt(str, 10))
    const newSelectedDate = setHours(setMinutes(setSeconds(dateTime, 0), minutes), hours)
    setTimeValue(time)
    onDateTimeChange(newSelectedDate)
  }

  const handleDaySelect = (date: Date | undefined) => {
    if (!timeValue || !date) {
      return
    }
    const [hours, minutes] = timeValue
      .split(':')
      .map(str => Number.parseInt(str, 10))
    const newDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      hours,
      minutes,
    )
    onDateTimeChange(newDate)
  }

  return (
    <div>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-[280px] justify-start text-left font-normal',
              !dateTime && 'text-muted-foreground',
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateTime ? dateTime.toLocaleString() : <span>选择日期时间</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <form>
            <Label className='flex gap-2 justify-center items-center my-2'>
              <span>设置时间:</span>
              <Input className='w-min' type="time" value={timeValue} onChange={handleTimeChange} />
            </Label>
          </form>
          <Calendar
            mode="single"
            selected={dateTime}
            onSelect={handleDaySelect}
            className="rounded-md border shadow"
          />
        </PopoverContent>
      </Popover>

    </div>
  )
}

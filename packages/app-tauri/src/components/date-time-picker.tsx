import { Calendar } from '@/components/ui/calendar'

import { cn } from '@/lib/utils'
import { format, getHours, getMinutes, setHours, setMinutes, setSeconds } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { useState } from 'react'
import { TimePicker } from './time-picker'
import { Button } from './ui/button'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'

export function DateTimePicker({
  dateTime,
  onDateTimeChange,
  className,
}: {
  dateTime: Date
  onDateTimeChange: (date: Date) => void
  className?: string
}) {
  dateTime.setSeconds(0)
  const [timeValue, setTimeValue] = useState<[number, number]>([getHours(dateTime), getMinutes(dateTime)])

  const handleDaySelect = (date: Date | undefined) => {
    if (!timeValue || !date) {
      return
    }
    const [hours, minutes] = timeValue
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
    <div className={className}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              !dateTime && 'text-muted-foreground',
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateTime ? dateTime.toLocaleString() : <span>选择日期时间</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <TimePicker
            time={timeValue}
            labelName='设置时间:'
            className='w-full justify-center p-2'
            onTimeChange={(time) => {
              setTimeValue(time)
              const [hours, minutes] = time
              const newSelectedDate = setHours(setMinutes(setSeconds(dateTime, 0), minutes), hours)
              handleDaySelect(newSelectedDate)
            }}
          >
          </TimePicker>
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

/* eslint-disable unused-imports/no-unused-vars */

import { getGptFilter } from '@/api/user'
import { filterCssKey } from '@/constants'
import { cn } from '@/lib/utils'
import { Label } from '@radix-ui/react-label'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import imgSrc from '../assets/filter.png'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Slider } from './ui/slider'
import { Loader2Icon } from 'lucide-react'

const defaultFilterState = {
  'blur': 0,
  'brightness': 1,
  'contrast': 1,
  'grayscale': 0,
  'hue-rotate': 0,
  'invert': 0,
  'opacity': 1,
  'saturate': 1,
  'sepia': 0,
} as const

const filterOptions = {
  'blur': {
    label: '模糊度',
    max: 10,
    min: 0,
  },
  'brightness': {
    label: '亮度',
    max: 3,
    min: 0,
  },
  'contrast': {
    label: '对比度',
    max: 3,
    min: 0,
  },
  'grayscale': {
    label: '灰度',
    max: 1,
    min: 0,
  },
  'hue-rotate': {
    label: '色调',
    max: 360,
    min: 0,
  },
  'invert': {
    label: '反色',
    max: 1,
    min: 0,
  },
  'opacity': {
    label: '透明度',
    max: 1,
    min: 0,
  },
  'saturate': {
    label: '饱和度',
    max: 3,
    min: 0,
  },
  'sepia': {
    label: '褐色度',
    max: 1,
    min: 0,
  },
} as const

const unit = {
  'blur': 'px',
  'hue-rotate': 'deg',
} as const

export function FilterForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [filterState, setFilterState] = useState(defaultFilterState)

  const [filterCss, setFilterCss] = useState('')

  useEffect(() => {
    setFilterCss(Object.entries(filterState)
      .map(([key, value]) => `${key}(${value}${unit[key as keyof typeof unit] ?? ''})`)
      .join(' '))
  }, [filterState])

  const saveFilterState = useCallback(() => {
    localStorage.setItem(filterCssKey, filterCss)
    toast.success('滤镜保存成功', {
      position: 'top-center',
    })
  }, [filterCss])

  const [prompt, setPrompt] = useState('')

  const [isPending, setIsPending] = useState(false)

  const handlePrompt = useCallback(async () => {
    if (isPending)
      return
    setIsPending(true)
    try {
      const res = await getGptFilter({ prompt })
      if (res?.data) {
        const obj = JSON.parse(res.data.filter)
        if (Object(obj) !== obj)
          return
        setFilterState({ ...defaultFilterState, ...obj })
        toast.success(res?.msg ?? '获取推荐滤镜成功', {
          position: 'top-center',
        })
      }
    }
    catch (e) {
      toast.error('获取推荐滤镜失败', {
        position: 'top-center',
      })
    }
    finally {
      setPrompt('')
      setIsPending(false)
    }
  }, [prompt, isPending])
  return (
    <div className={cn()}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">设置滤镜</CardTitle>
          <img src={imgSrc} className="w-full" style={{ filter: filterCss }} alt="" />
        </CardHeader>
        <CardContent>
          <form>
            <div className="flex flex-col gap-2">
              {Object.entries(filterOptions).map(([key, { label, min, max }]) => (
                <div key={key} className="flex gap-2">
                  <Label className="min-w-[100px]">
                    {label}
                    {' '}
                    {[filterState[key as keyof typeof filterState]]}
                  </Label>
                  <Slider
                    value={[filterState[key as keyof typeof filterState]]}
                    max={max}
                    min={min}
                    step={Math.min(1, (max - min) / 100)}
                    onValueChange={value => setFilterState({ ...filterState, [key]: value[0] })}
                  >
                  </Slider>
                </div>
              ))}
              <Input
                id="prompt"
                placeholder="输入你的提示词，让AI为你生成滤镜"
                type="text"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
              />
              <div className="flex justify-between">
                <Button
                  disabled={prompt === '' || isPending}
                  onClick={(e) => {
                    e.preventDefault()
                    handlePrompt()
                  }}
                >
                  { isPending && <Loader2Icon className="animate-spin" />}
                  AI 生成滤镜
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault()
                      setFilterState({ ...defaultFilterState })
                    }}
                  >
                    重置
                  </Button>
                  <Button onClick={(e) => {
                    e.preventDefault()
                    saveFilterState()
                  }}
                  >
                    保存并应用
                  </Button>
                </div>

              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

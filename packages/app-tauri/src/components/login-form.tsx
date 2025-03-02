import { createUser, login } from '@/api/user'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authToken, userId } from '@/constants'
import { cn } from '@/lib/utils'
import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const [username, setUsername] = useState('')
  const [password1, setPassword1] = useState('')
  const [password2, setPassword2] = useState('')
  const [isSigningUp, setIsSigningUp] = useState(false)
  const navigate = useNavigate()
  const handleSignIn = async (e: Event) => {
    e.preventDefault()
    const res = await login({ id: username, password: password1 })
    if (res?.data?.auth_token) {
      sessionStorage.setItem(authToken, res.data.auth_token)
      sessionStorage.setItem(userId, username)
      toast.success('登录成功', {
        position: 'top-center',
      })
      navigate('/')
    }
  }
  const handleSignUp = async (e: Event) => {
    e.preventDefault()
    const res = await createUser({ id: username, password: password1 })
    if (!res)
      return
    await handleSignIn(e)
  }
  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{ isSigningUp ? '创建账号' : '登录'}</CardTitle>
          <CardDescription>
            { isSigningUp ? '输入账号名及密码创建新账号' : '输入账号名及密码登录'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="acctname">账号名</Label>
                <Input
                  id="acctname"
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password1">密码</Label>
                </div>
                <Input id="password1" type="password" value={password1} required onChange={e => setPassword1(e.target.value)} />
              </div>
              { isSigningUp && (
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password2">确认密码</Label>
                  </div>
                  <Input id="password2" type="password" value={password2} required onChange={e => setPassword2(e.target.value)} />
                </div>
              )}
              <Button className="w-full" disabled={(!username || !password1) || (isSigningUp && password1 !== password2)} onClick={isSigningUp ? handleSignUp : handleSignIn}>
                { isSigningUp ? '创建账号并登录' : '登录' }
              </Button>
              <div className="text-center text-sm">

                { isSigningUp ? '已有账号？ ' : '没有账号？ '}
                <a href="#" className="underline underline-offset-4" onClick={() => setIsSigningUp(!isSigningUp)}>
                  { isSigningUp ? '登录' : '创建一个'}
                </a>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

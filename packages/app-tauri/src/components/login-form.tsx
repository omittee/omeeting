import { createUser, login, updatePassword } from '@/api/user'
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
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

export function LoginForm({
  className,
  isEdit = false,
  onFinished,
  ...props
}: React.ComponentPropsWithoutRef<'div'> & { isEdit?: boolean, onFinished?: () => void }) {
  const [username, setUsername] = useState(localStorage.getItem(userId) ?? '')
  const [password0, setPassword0] = useState('')
  const [password1, setPassword1] = useState('')
  const [password2, setPassword2] = useState('')
  const [isSigningUp, setIsSigningUp] = useState(false)
  const navigate = useNavigate()
  const handleSignIn = async (successTitle?: string = '登录成功') => {
    const res = await login({ id: username, password: password1 })
    if (res?.data?.auth_token) {
      localStorage.setItem(authToken, res.data.auth_token)
      localStorage.setItem(userId, username)
      toast.success(successTitle, {
        position: 'top-center',
      })
      navigate('/')
    }
  }
  const handleSignUp = async () => {
    const res = await createUser({ id: username, password: password1 })
    if (!res)
      return
    await handleSignIn()
  }
  const handleEdit = async () => {
    const res = await updatePassword({ old_password: password0, new_password: password1 })
    if (!res)
      return
    await handleSignIn('修改密码成功')
  }
  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{ isEdit ? '编辑账号' : isSigningUp ? '创建账号' : '登录'}</CardTitle>
          <CardDescription>
            { isEdit ? '修改账号密码' : isSigningUp ? '输入账号名及密码创建新账号' : '输入账号名及密码登录'}
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
                  disabled={isEdit}
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
              </div>
              { isEdit && (
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password1">旧密码</Label>
                  </div>
                  <Input id="password0" type="password" value={password0} required onChange={e => setPassword0(e.target.value)} />
                </div>
              )}
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password1">{ isEdit ? '新密码' : '密码'}</Label>
                </div>
                <Input id="password1" type="password" value={password1} required onChange={e => setPassword1(e.target.value)} />
              </div>
              { (isEdit || isSigningUp) && (
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password2">{ isEdit ? '确认新密码' : '确认密码'}</Label>
                  </div>
                  <Input id="password2" type="password" value={password2} required onChange={e => setPassword2(e.target.value)} />
                </div>
              )}
              <Button
                className="w-full"
                disabled={(isEdit ? !password0 : (!username || !password1)) || ((isEdit || isSigningUp) && password1 !== password2)}
                onClick={(e) => {
                  e.preventDefault()
                  if (isEdit)
                    handleEdit()
                  else isSigningUp ? handleSignUp() : handleSignIn()
                  onFinished?.()
                }}
              >
                { isSigningUp ? '创建账号并登录' : '登录' }
              </Button>
              { isEdit || (
                <div className="text-center text-sm">

                  { isSigningUp ? '已有账号？ ' : '没有账号？ '}
                  <a href="#" className="underline underline-offset-4" onClick={() => setIsSigningUp(!isSigningUp)}>
                    { isSigningUp ? '登录' : '创建一个'}
                  </a>
                </div>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

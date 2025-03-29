import type { ComponentProps } from 'react'

import { deleteUser } from '@/api/user'
import {
  Avatar,
  AvatarFallback,
} from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { authToken, userId } from '@/constants'
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  DeleteIcon,
  LogOut,
  Sparkles,
} from 'lucide-react'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { LoginForm } from './login-form'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from './ui/dialog'
import { FilterForm } from './filter-form'

export function User({
  className,
}: ComponentProps<'div'>) {
  const name = localStorage.getItem(userId) ?? ''
  const navigate = useNavigate()

  const logout = () => {
    localStorage.removeItem(authToken)
    localStorage.removeItem(userId)
    navigate('/auth')
  }
  const handleDeleteAcct = async () => {
    await deleteUser()
    logout()
  }
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false)

  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false)
  return (
    <div className={className}>
      <AlertDialog>
        <Dialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="lg"
                className="bg-sidebar text-sidebar-foreground peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left outline-none ring-sidebar-ring transition-[width,height,padding] focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-12 text-sm group-data-[collapsible=icon]:!p-0 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="rounded-lg">{ name.substring(0, 2) }</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{name}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              side="bottom"
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg">{ name.substring(0, 2) }</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{name}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setIsFilterDialogOpen(true)}>
                  <Sparkles />
                  编辑滤镜
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DialogTrigger className="w-full">
                  <DropdownMenuItem>
                    <BadgeCheck />
                    账号
                  </DropdownMenuItem>
                </DialogTrigger>
                <DropdownMenuItem>
                  <Bell />
                  通知
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut />
                退出登录
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialogTrigger className="w-full">
                <DropdownMenuItem>
                  <DeleteIcon />
                  删除账号
                </DropdownMenuItem>
              </AlertDialogTrigger>
            </DropdownMenuContent>
          </DropdownMenu>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确定要删除账号吗?</AlertDialogTitle>
              <AlertDialogDescription>
                删除的账号不可恢复
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction className="bg-red-500" onClick={handleDeleteAcct}>删除</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
          <DialogContent>
            <DialogTitle></DialogTitle>
            <LoginForm isEdit onFinished={() => setIsLoginDialogOpen(false)} />
          </DialogContent>
        </Dialog>
        <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
          <DialogContent>
            <DialogTitle></DialogTitle>
            <FilterForm />
          </DialogContent>
        </Dialog>
      </AlertDialog>

    </div>
  )
}

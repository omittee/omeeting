import { Button } from '@/components/ui/button'
import { User } from '@/components/user'

export default function Home() {
  return (
    <div className=" p-8">
      <User user={{ name: 'John Doe', email: 'g5V5l@example.com', avatar: '' }} />
      <div className="flex flex-1 gap-4 w-full pt-10">
        <Button>加入会议</Button>
        <Button>创建会议</Button>
      </div>
    </div>
  )
}

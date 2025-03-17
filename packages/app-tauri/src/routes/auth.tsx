import { LoginForm } from '@/components/login-form'

export default function Auth() {
  return (
    <div className="p-8 h-full">
      <div className="text-4xl font-extrabold pb-4 italic">Omeeting</div>
      <LoginForm />
    </div>
  )
}

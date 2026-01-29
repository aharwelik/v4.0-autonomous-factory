import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <SignUp
        appearance={{
          elements: {
            formButtonPrimary:
              'bg-primary text-primary-foreground hover:bg-primary/90',
            card: 'shadow-xl',
          },
        }}
      />
    </div>
  );
}

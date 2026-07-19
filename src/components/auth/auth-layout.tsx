import { RegistrationStepper } from '@/components/auth/registration-stepper'
import React from 'react'

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  description: string
  backgroundImage?: string
  quote?: string
  stepperSteps?: Array<{ id: number; title: string; description: string }>
  currentStep?: number
  mobileTitle?: string
}

export function AuthLayout({
  children,
  title,
  description,
  backgroundImage = '/edumater_auth.jpg',
  quote,
  stepperSteps,
  currentStep,
  mobileTitle,
}: AuthLayoutProps) {
  return (
    <div className="fixed inset-0 w-full grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] bg-background">
      {/* Left Panel - Image & Context */}
      <div
        className="hidden lg:flex flex-col relative bg-cover bg-center p-12 text-white h-full overflow-hidden"
        style={{ backgroundImage: `url("${backgroundImage}")` }}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />

        <div className="relative z-10 flex flex-col h-full justify-center">
          <div className="mb-12">
            <h1 className="text-4xl font-extrabold tracking-tight mb-4">
              Schola
            </h1>
            <p className="text-xl text-white/90 font-medium max-w-md">
              {description}
            </p>
          </div>

          {stepperSteps && currentStep !== undefined && (
            <div className="mt-8">
              <RegistrationStepper
                steps={stepperSteps}
                currentStep={currentStep}
                variant="white"
              />
            </div>
          )}

          {quote && (
            <div className="mt-auto bg-black/40 backdrop-blur-md rounded-xl p-6 border border-white/10">
              <p className="text-sm font-medium leading-relaxed italic opacity-90">
                "{quote}"
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex flex-col p-6 sm:p-8 bg-background overflow-y-auto h-full">
        <div className="w-full max-w-[480px] mx-auto py-12 lg:py-16">
          {/* Mobile Header */}
          <div className="lg:hidden mb-12 text-center">
            <h1 className="text-4xl font-black text-primary tracking-tighter italic mb-8">
              {mobileTitle || 'Schola'}
            </h1>
            {stepperSteps && currentStep !== undefined && (
              <div className="flex justify-center">
                <RegistrationStepper
                  steps={stepperSteps}
                  currentStep={currentStep}
                  orientation="horizontal"
                />
              </div>
            )}
          </div>

          <div className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
              <p className="text-muted-foreground">{description}</p>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

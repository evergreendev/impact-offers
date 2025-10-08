import React from 'react'
import './styles.css'

export const metadata = {
  description: 'The best deals in the Black Hills at your fingertips',
  title: 'Impact Offers',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body>
        <main>
          <div className="p-6 max-w-screen-lg w-full mx-auto bg-white text-slate-900">
            {children}
          </div>
        </main>
      </body>
    </html>
  )
}

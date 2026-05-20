'use client'

import React from 'react'

type Props = {
  name: string
  age: number
  location: string
  image: string
}

export default function ProfileCard({ name, age, location, image }: Props) {
  return (
    <div className="card-flashy p-4">
      <div className="relative w-full h-56 overflow-hidden rounded-lg">
        <img src={image} alt={name} className="w-full h-full object-cover" />
        <div className="absolute bottom-3 left-3 bg-white/80 backdrop-blur-md rounded-md px-3 py-1">
          <div className="font-semibold text-sm">{name}, <span className="font-normal">{age}</span></div>
          <div className="text-xs text-gray-600">{location}</div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="text-sm text-gray-700">Open to meetings &nbsp;·&nbsp; Verified</div>
        <button className="btn bg-brand-500 text-white">Connect</button>
      </div>
    </div>
  )
}

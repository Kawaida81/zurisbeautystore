'use client'

import Image from 'next/image'
import Link from 'next/link'

const services = [
  {
    id: 1,
    name: 'Makeup',
    image: '/images/MakeUp.jpg',
    href: '/services/makeup',
  },
  {
    id: 2,
    name: 'Hair Braiding',
    image: '/images/Hair.jpg',
    href: '/services/hair',
  },
  {
    id: 3,
    name: 'Nails',
    image: '/images/Nails.jpg',
    href: '/services/nails',
  },
  {
    id: 4,
    name: 'Skin',
    image: '/images/Skin.jpg',
    href: '/services/skin',
  },
]

export default function Services() {
  return (
    <section className="py-16 md:py-20 lg:py-24 bg-[#FF6B6B]/5">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <h2 className="text-4xl font-bold mb-12 text-center text-[#0A0A0A]">
          CHECK OUT OUR SERVICES
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {services.map((service) => (
            <Link
              key={service.id}
              href="/sign-up"
              className="group relative aspect-[3/4] overflow-hidden rounded-xl bg-[#FFFFFF] shadow-sm hover:shadow-lg transition-all duration-300"
            >
              <Image
                src={service.image}
                alt={service.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/90 to-transparent opacity-60 group-hover:opacity-70 transition-opacity duration-300" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center transform transition-transform duration-300 group-hover:translate-y-[-8px]">
                  <h3 className="text-2xl font-bold text-[#FFFFFF] mb-3">{service.name}</h3>
                  <span className="inline-block px-6 py-2 bg-[#FF6B6B] text-[#FFFFFF] text-sm font-medium rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 shadow-lg">
                    Book Now
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
} 
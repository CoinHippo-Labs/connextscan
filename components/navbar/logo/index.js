import Link from 'next/link'

export default function Logo() {
  return (
    <div className="logo ml-1.5 mr-0.5 sm:mx-3">
      <Link href="/">
        <a className="w-full flex items-center space-x-0 sm:space-x-3 lg:space-x-0 xl:space-x-4">
          <img
          	src="/logos/logo.png"
          	alt=""
          	className="w-8 xl:w-10 h-8 xl:h-10 rounded-full"
          />
          <span className="hidden sm:block lg:hidden xl:block uppercase text-base font-semibold">{process.env.NEXT_PUBLIC_APP_NAME}</span>
        </a>
      </Link>
    </div>
  )
}
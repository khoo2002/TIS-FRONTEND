import React, { useEffect, useRef, useState } from 'react'

export default function Header({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const profileRef = useRef<HTMLDivElement | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)

  useEffect(() => {
    function onDocClick(e: Event) {
      const target = e.target as Node | null
      // close slide-over if click outside
      if (menuRef.current && target && !menuRef.current.contains(target)) {
        setOpen(false)
      }
      // close right dropdown if click outside
      if (dropdownRef.current && target && !dropdownRef.current.contains(target)) {
        setDropdownOpen(false)
      }
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('touchstart', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('touchstart', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const toggle = () => setOpen((v) => !v)
  const go = (href: string) => {
    setOpen(false)
    // ensure page starts at top when navigating
    try {
      window.scrollTo({ top: 0, left: 0 })
    } catch (e) {}
    window.location.href = href
  }

  // persist autoRefresh setting
  useEffect(() => {
    try {
      const raw = localStorage.getItem('autoRefresh')
      if (raw !== null) {
        setAutoRefresh(JSON.parse(raw))
      } else {
        // default to ON
        setAutoRefresh(true)
      }
    } catch (e) {
      // ignore
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('autoRefresh', JSON.stringify(autoRefresh))
    } catch (e) {}
  }, [autoRefresh])

  return (
    <div className="bg-pink-400 shadow-md">
  <header className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center">
          {/* Hamburger - original left placement */}
          <button
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={toggle}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                toggle()
              }
            }}
            className="text-white mr-4 p-0 bg-transparent border-0"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </svg>
          </button>

          <button className="text-white mr-1 p-0 bg-transparent border-0" aria-label="Home" onClick={() => go('/') }>
            <img alt="NSC-TIP Logo" className="h-12" src="/logo.png" />
          </button>
          <span className="text-2xl font-bold text-white ml-2">NSC-TIP</span>
        </div>

        {/* right-side controls: three-dot menu and children */}
        <div className="flex items-center space-x-3">
          <div className="relative" ref={dropdownRef}>
            <button
              aria-haspopup="true"
              aria-expanded={dropdownOpen}
              aria-label="Open options"
              onClick={() => setDropdownOpen((v) => !v)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setDropdownOpen((v) => !v)
                }
              }}
              className="text-white p-2 bg-transparent border-0 rounded hover:bg-pink-500/20"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 6a2 2 0 110-4 2 2 0 010 4zm0 8a2 2 0 110-4 2 2 0 010 4zm0 8a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white text-gray-800 rounded shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">Auto refresh</div>
                    <button
                      role="switch"
                      aria-checked={autoRefresh}
                      onClick={() => setAutoRefresh(v => !v)}
                      className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 rounded-full transition-colors focus:outline-none ${autoRefresh ? 'bg-pink-600 border-pink-600' : 'bg-gray-200 border-gray-200'}`}
                    >
                      <span className={`inline-block h-5 w-5 bg-white rounded-full shadow transform transition-transform ${autoRefresh ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">When enabled, the CVE list will auto-refresh periodically.</div>
                </div>
              </div>
            )}
          </div>
          {/* profile avatar */}
          <div className="relative" ref={profileRef}>
            <button
              aria-haspopup="true"
              aria-expanded={profileOpen}
              aria-label="Open profile menu"
              onClick={() => setProfileOpen(v => !v)}
              className="ml-2 inline-flex items-center text-white bg-transparent rounded-full"
            >
              {/* <img src="/profile-placeholder.png" alt="Profile" className="h-9 w-9 rounded-full border-2 border-white" />
               */}
               <span className="h-9 w-9 inline-flex items-center justify-center rounded-full bg-white/20 border-2 border-white text-white"> 
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zM4 20c0-2.21 3.58-4 8-4s8 1.79 8 4" />
                </svg>
              </span>
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white text-gray-800 rounded shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                <div className="p-3 border-b">
                  <div className="font-medium">Jane Doe</div>
                  <div className="text-xs text-gray-500">Administrator</div>
                </div>
                <div className="p-2">
                  <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-100" onClick={() => { setProfileOpen(false); go('/profile') }}>View profile</button>
                  <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-100" onClick={() => { setProfileOpen(false); go('/settings') }}>Settings</button>
                  <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-red-600" onClick={() => { setProfileOpen(false); /* placeholder logout */ go('/logout') }}>Logout</button>
                </div>
              </div>
            )}
          </div>

          <div className="ml-4 hidden sm:block">{children}</div>
        </div>

        {/* Slide-over panel */}
        {open && (
          <div className="fixed inset-0 z-40 flex">
            {/* overlay */}
            <button aria-hidden className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setOpen(false)} />

            <nav ref={menuRef} className="relative bg-white w-80 md:w-1/3 h-full shadow-xl">
              <div className="p-4 flex items-center justify-between border-b">
                <div className="font-semibold">Menu</div>
                <button aria-label="Close menu" onClick={() => setOpen(false)} className="text-gray-600 hover:text-gray-800">✕</button>
              </div>
              <div className="p-4">
                <ul className="space-y-2">
                  <li><button className="w-full text-left px-3 py-2 rounded hover:bg-gray-100" onClick={() => go('/')}>Home</button></li>
                  <li><button className="w-full text-left px-3 py-2 rounded hover:bg-gray-100" onClick={() => go('/vulnerabilities')}>Vulnerabilities</button></li>
                  <li><button className="w-full text-left px-3 py-2 rounded hover:bg-gray-100" onClick={() => go('/threats')}>Threat Feed</button></li>
                  <li><button className="w-full text-left px-3 py-2 rounded hover:bg-gray-100" onClick={() => go('/about')}>About</button></li>
                  <li><button className="w-full text-left px-3 py-2 rounded hover:bg-gray-100" onClick={() => go('/settings')}>Settings</button></li>
                </ul>
              </div>
            </nav>
          </div>
        )}
      </header>
    </div>
  )
}

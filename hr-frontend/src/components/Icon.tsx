const paths = {
  home: 'M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5',
  calendar: 'M7 3v4m10-4v4M4 8h16M5 6h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Zm1 8h4v4H6Z',
  users:
    'M16 19v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V19m7-9a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm12 9v-1.5a4 4 0 0 0-3-3.87M15 3.13a4 4 0 0 1 0 7.75M18 21H2',
  building: 'M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16m0-10h3a2 2 0 0 1 2 2v8M2 21h20M8 7h2m-2 4h2m-2 4h2',
  shield: 'M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6l8-3Zm-2.5 9 2 2 3.5-3.5',
  bell: 'M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Zm4.5 9a1.5 1.5 0 0 0 3 0',
  clipboard:
    'M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1Zm-2 2H6a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-1M9 12h6m-6 4h4',
  logout: 'M15 17l5-5-5-5m5 5H9M12 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6',
} as const

export type IconName = keyof typeof paths

export function Icon({ name, size = 17 }: { name: IconName; size?: number }) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  )
}

export type ChangelogRelease = {
  id: string
  version: string
  /** ISO date YYYY-MM-DD */
  date: string
  /** messages.changelogPage.releases.<id>.items.<key> */
  itemKeys: string[]
}

/** 版本列表：新版本插到数组前面；文案在 messages 各语言的 changelogPage.releases */
export const CHANGELOG_RELEASES: ChangelogRelease[] = [
  {
    id: 'v1-2-0',
    version: 'v1.2.0',
    date: '2026-08-17',
    itemKeys: ['examTimer', 'mobileClocks', 'japanese'],
  },
  {
    id: 'v1-1-0',
    version: 'v1.1.0',
    date: '2026-08-11',
    itemKeys: ['interval', 'hiit', 'tabata', 'stopwatchDial'],
  },
  {
    id: 'v1-0-0',
    version: 'v1.0.0',
    date: '2026-08-01',
    itemKeys: [
      'timer',
      'world',
      'flip',
      'digital',
      'stopwatch',
      'fullscreen',
      'settings',
      'local',
      'responsive',
      'privacy',
    ],
  },
]

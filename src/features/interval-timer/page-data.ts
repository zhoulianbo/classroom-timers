import type { Locale } from '@/config/i18n'
import type { IntervalVariant } from './types'

type PageData = {
  path: string
  metadata: { title: string; description: string }
  heading: string
  faqTitle: string
  intro: string
  blocks: { heading: string; paragraphs?: string[]; bullets?: string[] }[]
  faqs: { q: string; a: string }[]
  sourcesTitle?: string
  sources?: { label: string; href: string }[]
  relatedTitle: string
  relatedIntro: string
}

const paths: Record<IntervalVariant, string> = {
  interval: '/timer/interval-timer',
  hiit: '/timer/hiit-timer',
  tabata: '/timer/tabata-timer',
}

const en: Record<IntervalVariant, Omit<PageData, 'path'>> = {
  interval: {
    metadata: { title: 'Online Interval Timer — Custom Work & Rest', description: 'Free online interval timer with a 40/20 preset and custom work/rest rounds. Set 1–99 rounds, warm-up, cool-down, alerts and full screen—no app needed.' },
    heading: 'Free Online Interval Timer',
    faqTitle: 'Online Interval Timer FAQ',
    intro: 'Build repeating work and rest rounds in seconds with a free online interval timer that runs directly in your browser. The large countdown stays readable on a phone, classroom screen or gym display, and you can click the time itself to start or pause.',
    blocks: [
      {
        heading: 'Create custom work and rest intervals',
        paragraphs: [
          'An online interval timer alternates between timed phases instead of stopping after one countdown. Set how long each work period lasts, how much recovery or transition time follows it, and how many rounds should repeat. The full sequence is prepared before you press Start, so you can focus on the activity instead of resetting a separate timer after every phase.',
          'Use the general setup for exercise circuits, study cycles, presentation practice, debate turns, station rotations or any routine that needs consistent phase timing. The online interval timer accepts 1–99 rounds and also supports an optional warm-up and cool-down around the repeating sequence.',
        ],
        bullets: [
          'Set work and rest durations in seconds for precise short or long intervals.',
          'Choose 1–99 rounds and see the total session structure before starting.',
          'Add optional warm-up and cool-down phases without creating another timer.',
        ],
      },
      {
        heading: 'Choose a 40/20 interval timer or another preset',
        paragraphs: [
          'Four presets cover common starting points while keeping every value editable. Work / rest starts at 60 seconds of activity and 30 seconds of rest for five rounds. The 40/20 interval timer preset uses 40 seconds of work and 20 seconds of rest for eight rounds. Classroom rotation uses 10-minute activity blocks with two-minute transitions for four rounds, while Circuit uses equal 30-second phases for ten rounds.',
          'A preset is only a shortcut. After selecting one, open Settings to change the duration, round count, phase order or alert. The online interval timer keeps your latest configuration in this browser, making it easier to return to the same routine without creating an account.',
        ],
        bullets: [
          'Work / rest: 60 seconds work, 30 seconds rest, 5 rounds.',
          '40/20 Work–Rest: 40 seconds work, 20 seconds rest, 8 rounds.',
          'Classroom rotation: 10 minutes work, 2 minutes transition, 4 rounds.',
          'Circuit: 30 seconds work, 30 seconds rest, 10 rounds.',
        ],
      },
      {
        heading: 'Alerts and full-screen progress',
        paragraphs: [
          'Sound cues let participants follow the routine without watching every second. Choose three beeps, a 10-second warning, a single short or long beep, an alternating beep, bell, chime or soft tone. The current phase name, round number, remaining time and session progress stay visible, so the timer remains usable when sound is muted or unavailable.',
          'Full-screen mode removes the surrounding page and keeps the active phase, large countdown, timeline and essential controls on screen. The online interval timer is therefore easy to follow on projectors, shared displays and training-space screens from a distance.',
        ],
        bullets: [
          'Preview alert sounds before starting the session.',
          'Follow visual phase and progress feedback when the device is muted.',
          'Use full screen for a distraction-free classroom or workout display.',
        ],
      },
      {
        heading: 'How to use the online interval timer',
        paragraphs: [
          'Choose a preset or open Settings and enter your own work time, rest time and rounds. Click the large countdown or the Start button to begin. While the session is active, use Previous or Skip to move between phases, Pause when the group needs more time, and Reset to return to the beginning.',
          'The online interval timer shows every active and recovery phase in order on the upcoming-interval timeline. Completed phases become visually muted, and any available phase can be selected to jump directly to it. Elapsed time, the current round and total remaining time provide a quick summary without opening the settings panel.',
        ],
        bullets: [
          'Select a preset or customize the full routine before starting.',
          'Click the large time to start, pause or resume without finding a small control.',
          'Use the phase timeline to review or jump to another interval.',
        ],
      },
      {
        heading: 'When to use a custom interval timer',
        paragraphs: [
          'Teachers can use repeated intervals for learning stations, partner exchanges, timed discussion turns and activity-to-cleanup transitions. Coaches and individuals can time circuits, mobility work or alternating effort and recovery. The same structure also works for focused work blocks, rehearsal drills and meeting activities where every participant needs a shared visual pace.',
          'Use the built-in 40/20 interval timer preset when neutral Work and Rest labels fit the activity. For workout-specific High intensity and Recovery labels, use the HIIT timer. For the classic four-minute 20/10 protocol, use the Tabata timer. Keeping those modes separate lets this online interval timer remain focused on flexible, custom phase sequences.',
        ],
      },
    ],
    faqs: [
      { q: 'Is this interval timer free?', a: 'Yes. It runs in the browser without an account or download.' },
      { q: 'Can I customize work, rest and rounds?', a: 'Yes. Set each phase in seconds, choose 1–99 rounds, and optionally add warm-up and cool-down phases.' },
      { q: 'Does it work in full screen?', a: 'Yes. Full screen keeps the phase, large time, progress and controls visible while hiding page content.' },
      { q: 'Can I use it for classroom rotations?', a: 'Yes. The classroom rotation preset starts with 10-minute work and 2-minute transition rounds, and can be edited.' },
      { q: 'Can I use a 40/20 interval timer preset?', a: 'Yes. Select 40 / 20 Work–Rest for 40 seconds of work, 20 seconds of rest and 8 rounds, then edit any value in Settings.' },
      { q: 'Will the online interval timer keep my settings?', a: 'Yes. The latest settings are stored locally in this browser. No timer name or configuration is sent to an account.' },
      { q: 'What is the difference between an interval timer and a normal timer?', a: 'A normal timer counts down once. An interval timer automatically alternates work and rest phases for the number of rounds you choose.' },
    ],
    relatedTitle: 'Interval timer presets', relatedIntro: 'Use the general interval timer for custom rounds, or open a focused HIIT or Tabata setup.',
  },
  hiit: {
    metadata: { title: 'Online HIIT Timer — Free Workout Intervals', description: 'Free online HIIT timer with 40/20, 30/15 and 45/15 presets. Track rounds, use 10-second warnings and go full screen. No app or account needed—start now.' },
    heading: 'Free Online HIIT Timer', faqTitle: 'HIIT Timer FAQ',
    intro: 'Run high-intensity and recovery intervals without installing an app. This free online HIIT timer starts at 40 seconds of hard work and 20 seconds of recovery for 8 rounds, with alternative workout ratios available in one tap.',
    blocks: [
      {
        heading: 'What an online HIIT timer does',
        paragraphs: [
          'High-intensity interval training alternates repeated bouts of harder effort with recovery periods. An online HIIT timer manages those changes automatically, announces the next phase and keeps count of the rounds. That removes the need to watch a stopwatch or calculate when each recovery period should end.',
          'This page uses High intensity and Recovery labels throughout the display. The dedicated wording makes the current instruction clear during a workout, while the large countdown, round counter and total-session progress help you understand how much work remains at a glance.',
        ],
        bullets: [
          'Automatic high-intensity and recovery phase changes.',
          'Round, elapsed-time and remaining-session tracking.',
          'Optional warm-up and cool-down in the same workout sequence.',
        ],
      },
      {
        heading: 'Choose a 40/20, 30/15 or 45/15 HIIT preset',
        paragraphs: [
          'The default 40/20 workout balances a longer effort with a meaningful recovery and repeats for eight rounds. Quick HIIT uses 30 seconds of work and 15 seconds of recovery for ten rounds. Power intervals use 45 seconds of work and 15 seconds of recovery for eight rounds. These are timing templates, not prescribed intensity levels, and every duration can be changed in Settings.',
          'Choose a ratio in the online HIIT timer that matches the activity, available space and experience of the participants. A shorter work interval can be easier to coordinate for fast movements, while a longer recovery may be appropriate when technique or group instruction needs more attention.',
        ],
        bullets: [
          '40/20 × 8: the balanced default HIIT timer preset.',
          '30/15 × 10: shorter work and recovery periods with more rounds.',
          '45/15 × 8: longer work periods and brief recovery.',
        ],
      },
      {
        heading: 'HIIT alerts, warnings and full-screen feedback',
        paragraphs: [
          'The default HIIT alert adds a warning during the final 10 seconds and plays three beeps at the phase change. You can switch to shorter or longer beeps, an alternating cue, bell, chime or soft tone. A visual phase label and progress background remain available when the browser or device is muted.',
          'Use full screen when the online HIIT timer is shared on a wall display, gym television or classroom projector. The active phase and countdown remain dominant, while Previous, Start or Pause, Skip and Reset stay available without bringing the page content into the workout view.',
        ],
        bullets: [
          'Ten-second warning before the active phase ends.',
          'Multiple alert styles for loud, quiet or shared environments.',
          'Visual progress and phase labels that do not depend on sound alone.',
        ],
      },
      {
        heading: 'How to use the online HIIT timer',
        paragraphs: [
          'Select one of the three HIIT presets or customize work, recovery, rounds, warm-up and cool-down in Settings. Click the large time or Start to begin. Follow the High intensity and Recovery labels, and use the upcoming-interval timeline to see the sequence before the next transition arrives.',
          'Pause the workout when participants need instruction, skip to the next phase when an exercise ends early, or return to a previous interval. Clicking an available phase in the timeline jumps directly to it. When the last recovery or cool-down finishes, the timer shows a clear completed state instead of silently restarting.',
        ],
        bullets: [
          'Prepare the workout ratio and round count before pressing Start.',
          'Click the large countdown to pause or resume quickly.',
          'Track the current round and total remaining time throughout the session.',
        ],
      },
      {
        heading: 'HIIT timer safety and workout planning',
        paragraphs: [
          'This online HIIT timer provides timing and display controls only; it does not decide which exercise, intensity or recovery period is appropriate for you. High-intensity work should be scaled to the person and activity. Include enough preparation, choose movements you can perform with control, and stop when continuing would be unsafe.',
          'HIIT is broader than one fixed ratio. If you need completely custom labels or a classroom rotation, use the general interval timer. If you specifically want the classic 20 seconds work and 10 seconds rest repeated eight times, open the Tabata timer.',
        ],
      },
    ],
    faqs: [
      { q: 'What HIIT interval should I start with?', a: '40 seconds hard and 20 seconds recovery for 8 rounds is a practical default. Adjust intensity and rest for your experience and activity.' },
      { q: 'Does the HIIT timer warn me before a round changes?', a: 'Yes. The default HIIT alert includes a 10-second warning and three beeps at the phase change.' },
      { q: 'Can I add a warm-up and cool-down?', a: 'Yes. Both are optional settings and become part of the same timed session.' },
      { q: 'Is this medical or training advice?', a: 'No. It is a timing tool. Choose exercise intensity appropriate for you and seek qualified guidance when needed.' },
      { q: 'Can I change the 40/20 HIIT timer ratio?', a: 'Yes. Work time, recovery time and round count are editable, and the original 40/20 preset remains available.' },
      { q: 'Does this HIIT timer work without an app?', a: 'Yes. It runs in a modern web browser on desktop, tablet or phone and requires no account or download.' },
    ],
    sourcesTitle: 'HIIT reference',
    sources: [
      { label: 'American College of Sports Medicine: High-Intensity Interval Training', href: 'https://www.acsm.org/docs/default-source/files-for-resource-library/high-intensity-interval-training.pdf' },
    ],
    relatedTitle: 'More interval timer modes', relatedIntro: 'Switch to classic Tabata intervals or build a completely custom work/rest session.',
  },
  tabata: {
    metadata: { title: 'Online Tabata Timer — Free 20/10 × 8', description: 'Free online Tabata timer with classic 20/10 × 8 and a 40/20 option. Get audio cues, round progress and full-screen mode—no app or account needed—start free.' },
    heading: 'Free Online Tabata Timer — 20/10 × 8', faqTitle: 'Online Tabata Timer FAQ',
    intro: 'Start the classic four-minute Tabata structure with 20 seconds of work and 10 seconds of rest for 8 rounds. This free online Tabata timer keeps the active phase, countdown and round readable at a glance without an app or account.',
    blocks: [
      {
        heading: 'Classic 20/10 Tabata timer',
        paragraphs: [
          'The online Tabata timer alternates 20 seconds of activity with 10 seconds of rest for eight rounds. Each active-and-recovery pair lasts 30 seconds, so the complete sequence is four minutes. The timer prepares all 16 phases in advance and moves through them automatically while displaying the current round and total time remaining.',
          'The 20/10 timing comes from a specific high-intensity intermittent training protocol. Many workouts now use the name Tabata more broadly, but this page keeps the classic 20 seconds work, 10 seconds rest and eight-round structure available as the default preset.',
        ],
        bullets: [
          '20 seconds work followed by 10 seconds rest.',
          '8 complete rounds and 16 automatic phase changes.',
          '4 minutes total when every active and recovery phase is included.',
        ],
      },
      {
        heading: 'Choose Classic Tabata or Sweat Tabata',
        paragraphs: [
          'The classic preset starts at 20/10 × 8. Although people may search for a Tabata timer 40/20, that longer ratio is more accurately described as HIIT: the Sweat Tabata preset uses 40 seconds of activity and 20 seconds of rest for eight rounds. Beginner uses equal 20-second phases for six rounds, while Extended keeps the classic 20/10 ratio for 12 rounds and six minutes.',
          'The 40/20, beginner and extended options are convenient timer variations rather than claims that they reproduce the original research protocol. Select a preset as a starting point, then edit the work time, rest time, number of rounds, warm-up or cool-down when the activity requires a different structure.',
        ],
        bullets: [
          'Classic: 20/10 × 8 for a four-minute sequence.',
          'Sweat Tabata: 40 seconds work, 20 seconds rest, 8 rounds.',
          'Beginner: 20/20 × 6 for equal activity and recovery.',
          'Extended: 20/10 × 12 for a six-minute sequence.',
        ],
      },
      {
        heading: 'Online Tabata timer alerts and visual cues',
        paragraphs: [
          'Three beeps mark each active and recovery change by default. Other choices include a 10-second warning, single short or long beeps, alternating beeps, bell, chime and a softer tone. Preview the alert in Settings before starting so the cue matches the volume and atmosphere of the room.',
          'The phase display communicates the same transition through the phase name, large countdown, round counter and progress background. This helps when sound is muted and gives everyone on a shared screen a clear indication of whether the timer is in Work or Rest.',
        ],
        bullets: [
          'Audible cue at every active and recovery transition.',
          'Optional warning before a phase finishes.',
          'Full-screen visual feedback for gyms, classes and home workouts.',
        ],
      },
      {
        heading: 'How to use the online Tabata timer',
        paragraphs: [
          'Open the online Tabata timer and click the large countdown or Start to begin the classic preset immediately. Follow the Work and Rest labels through all eight rounds. The timeline below the main display shows every phase in order, mutes completed phases and allows you to jump to an available interval when needed.',
          'Use Pause for instruction or an unexpected interruption, Previous to repeat a phase, Skip to advance, and Reset to return to the beginning. Full screen keeps the countdown and essential controls visible while hiding the explanatory content below the tool.',
        ],
        bullets: [
          'Start the classic four-minute timer in one click.',
          'Pause, resume, repeat or skip an interval without rebuilding the sequence.',
          'Follow round progress and total remaining time from the main display.',
        ],
      },
      {
        heading: 'Tabata, HIIT and custom intervals',
        paragraphs: [
          'Tabata is a particular high-intensity interval format, while HIIT can use many different work-to-recovery ratios. Choose the classic 20/10 × 8 structure when you want the original timing pattern, or select Sweat Tabata when the activity needs longer 40/20 phases. The HIIT timer adds workout-specific labels, while the general interval timer supports classroom rotations and fully custom rounds.',
          'The timer controls timing only and does not prescribe exercises or effort. Scale the activity to the participant, use a suitable warm-up and seek qualified guidance when health, injury or training concerns apply.',
        ],
      },
    ],
    faqs: [
      { q: 'What is the classic Tabata timer format?', a: 'The classic format is 20 seconds of work followed by 10 seconds of rest, repeated for 8 rounds.' },
      { q: 'How long is 20/10 × 8 on a Tabata timer?', a: 'It lasts 4 minutes when every active and recovery phase is included.' },
      { q: 'Can I change the Tabata rounds?', a: 'Yes. The classic preset stays available, while Settings lets you change work, rest and round count.' },
      { q: 'Can I use the Tabata timer 40/20 preset?', a: 'Yes. Choose Sweat Tabata for 40 seconds of work, 20 seconds of rest and 8 rounds. It is a HIIT variation; classic Tabata remains 20/10 × 8.' },
      { q: 'Can I use it on a gym or classroom screen?', a: 'Yes. The full-screen layout keeps the phase, time, progress and controls readable at a distance.' },
      { q: 'Is every 20/10 workout a classic Tabata workout?', a: 'The timer pattern is the same, but the original protocol also involved a specific exercise intensity. This page provides the timing structure, not a training prescription.' },
      { q: 'Do I need to download the online Tabata timer?', a: 'No. It runs in the browser on desktop, tablet or phone without an account or installation.' },
    ],
    sourcesTitle: 'Tabata reference',
    sources: [
      { label: 'Tabata et al. (1996): Effects of moderate-intensity endurance and high-intensity intermittent training', href: 'https://pubmed.ncbi.nlm.nih.gov/8897392/' },
    ],
    relatedTitle: 'More interval timer modes', relatedIntro: 'Open a flexible interval timer or use longer HIIT activity and recovery presets.',
  },
}

const zh: Record<IntervalVariant, Omit<PageData, 'path'>> = {
  interval: {
    metadata: { title: '在线间歇计时器：自定义工作、休息与轮次', description: '免费在线间歇计时器，提供 40/20 快捷预设，可设置工作、休息、1–99 轮、热身、冷身、声音提醒和全屏，无需 App 或账号。' },
    heading: '免费在线间歇计时器', faqTitle: '在线间歇计时器常见问题',
    intro: '使用免费在线间歇计时器，快速创建重复的工作与休息循环。大字倒计时适配手机、课堂大屏和训练场地，直接点击中间时间即可启动或暂停，无需安装 App。',
    blocks: [
      {
        heading: '自定义工作、休息与轮次',
        paragraphs: [
          '间歇计时器与普通单次倒计时不同，它会按照预先设定的顺序自动切换工作和休息阶段。只需设置每次工作的时长、阶段之间的休息或转场时间，以及需要重复的轮数，启动后就不必在每个阶段结束时手动重新计时。',
          '这种循环适合训练、课堂轮换、分组讨论、演讲练习、专注学习和需要统一节奏的会议活动。设置支持 1–99 轮，还可以在正式循环前后加入热身和冷身，让完整流程由同一个在线间歇计时器连续执行。',
        ],
        bullets: [
          '工作和休息时长按秒设置，短间隔与长活动都能精确控制。',
          '设置 1–99 轮，并在启动前查看完整阶段顺序。',
          '可选择热身、冷身以及从休息阶段开始。',
        ],
      },
      {
        heading: '选择 40/20 或其他间歇计时预设',
        paragraphs: [
          '页面提供四个常见起点。工作 / 休息预设为工作 60 秒、休息 30 秒、共 5 轮；40/20 间歇计时预设为工作 40 秒、休息 20 秒、共 8 轮；课堂轮换为活动 10 分钟、转场 2 分钟、共 4 轮；循环训练为工作和休息各 30 秒、共 10 轮。',
          '预设只是快速开始的模板，不会限制后续修改。选择预设后仍可在设置里调整时长、轮数、阶段顺序和提醒方式。最近一次配置会保存在当前浏览器中，不需要注册账号，也不会上传计时器名称。',
        ],
        bullets: [
          '工作 / 休息：60 秒工作、30 秒休息、5 轮。',
          '40/20 工作休息：40 秒工作、20 秒休息、8 轮。',
          '课堂轮换：10 分钟活动、2 分钟转场、4 轮。',
          '循环训练：30 秒工作、30 秒休息、10 轮。',
        ],
      },
      {
        heading: '声音提醒与全屏进度',
        paragraphs: [
          '声音提醒可以让参与者专注于当前任务，不必持续盯着秒数。可选择三次提示音、提前 10 秒预警、单次短音、单次长音、交替提示、铃声、钟琴或柔和提示音。当前阶段、轮次、剩余时间和总进度同时提供视觉反馈，因此设备静音时仍然可以正常使用。',
          '进入全屏后，页面正文和导航会被隐藏，只保留当前阶段、大字倒计时、阶段时间轴和必要控制。投影到课堂、训练场地或会议大屏时，远处的参与者也能看清当前是工作、休息还是转场。',
        ],
        bullets: [
          '开始前可在设置中试听提醒音。',
          '静音状态下仍有阶段名称、颜色和进度变化。',
          '全屏模式减少干扰，并保留暂停、跳过和复位控制。',
        ],
      },
      {
        heading: '如何使用在线间歇计时器',
        paragraphs: [
          '先选择快捷预设，或打开设置输入工作秒数、休息秒数和循环轮数。点击中间的大字时间或“启动”按钮即可开始。运行中可以暂停、返回上一阶段、跳过当前阶段，或复位到整个流程的起点。',
          '下方时间轴会按顺序列出所有工作和休息阶段。已完成内容会置灰，可用阶段能够点击跳转。已用时间、当前轮次和总剩余时间始终显示在主计时区域，查看完整进度时无需再次打开设置。',
        ],
        bullets: [
          '启动前选择预设或自定义完整循环。',
          '直接点击大字倒计时即可启动、暂停或继续。',
          '通过阶段时间轴查看顺序并跳转到指定间隔。',
        ],
      },
      {
        heading: '在线间歇计时器适合哪些场景',
        paragraphs: [
          '教师可以把重复阶段用于学习站点轮换、同伴交流、限时讨论和活动收尾；教练或个人用户可以安排循环训练、拉伸与恢复；专注工作、排练和会议环节也可以通过统一的大屏节奏减少反复提醒。',
          '需要中性的“工作 / 休息”标签时，可以直接选择内置 40/20 间歇计时预设；需要专门的“高强度 / 恢复”标签时，可以打开 HIIT 计时器；如果要使用经典 20 秒训练、10 秒休息、8 轮的四分钟结构，可以打开 Tabata 计时器。',
        ],
      },
    ],
    faqs: [
      { q: '这款间歇计时器免费吗？', a: '免费。直接在浏览器运行，无需账号或下载。' },
      { q: '可以自定义工作、休息和轮数吗？', a: '可以。每个阶段按秒设置，支持 1–99 轮，还能加入热身和冷身。' },
      { q: '支持全屏吗？', a: '支持。全屏只保留阶段、大字时间、进度和必要控制。' },
      { q: '可以用于课堂轮换吗？', a: '可以。课堂轮换预设为 10 分钟工作、2 分钟转场，可继续修改。' },
      { q: '可以直接使用 40/20 间歇计时吗？', a: '可以。选择“40 / 20 工作休息”即可使用 40 秒工作、20 秒休息、8 轮的设置，也可以继续修改。' },
      { q: '在线间歇计时器会保存我的设置吗？', a: '会。最近一次设置仅保存在当前浏览器中，无需账号，也不会上传计时器名称。' },
      { q: '间歇计时器和普通倒计时有什么区别？', a: '普通倒计时只执行一次；间歇计时器会按照设定轮数自动交替工作和休息阶段。' },
    ],
    relatedTitle: '间歇计时预设', relatedIntro: '通用页面适合自由设置，也可以直接打开 HIIT 或 Tabata 专用计时器。',
  },
  hiit: {
    metadata: { title: 'HIIT 计时器：40/20、30/15 在线训练间歇', description: '免费在线 HIIT 计时器，提供 40/20、30/15、45/15 预设、轮次进度、10 秒预警和全屏。无需 App 或账号，立即开始训练。' },
    heading: '免费在线 HIIT 计时器', faqTitle: 'HIIT 计时器常见问题',
    intro: '无需安装 App，直接使用免费在线 HIIT 计时器进行高强度与恢复循环。默认 40 秒高强度、20 秒恢复、8 轮，也可以一键切换其他训练比例。',
    blocks: [
      {
        heading: 'HIIT 计时器如何工作',
        paragraphs: [
          '高强度间歇训练会在较高强度活动和恢复阶段之间重复切换。HIIT 计时器自动处理阶段变化、提醒和轮数统计，使用者不必一直查看秒表，也不用在每次恢复结束时重新设定下一轮。',
          '这个专用页面会把两个阶段明确显示为“高强度”和“恢复”。大字倒计时、当前轮数、已用时间和总剩余时间同时显示，让个人、教练或整组参与者快速了解训练进行到哪里。',
        ],
        bullets: [
          '自动切换高强度和恢复阶段。',
          '同步显示当前轮次、总进度与剩余时间。',
          '可把热身和冷身加入同一个训练流程。',
        ],
      },
      {
        heading: '选择 40/20、30/15 或 45/15 HIIT 预设',
        paragraphs: [
          '默认 40/20 预设为 40 秒高强度、20 秒恢复，共 8 轮；快速 HIIT 为 30 秒高强度、15 秒恢复，共 10 轮；力量间歇为 45 秒高强度、15 秒恢复，共 8 轮。这些数值是方便启动的计时模板，不代表固定训练处方。',
          '选择比例时应考虑动作类型、场地、参与者经验和恢复需求。快速动作可能更适合较短工作阶段，需要讲解或技术控制时则可以增加恢复时间。所有工作、恢复和轮次数值都能在设置里修改。',
        ],
        bullets: [
          '40/20 × 8：默认的均衡 HIIT 计时预设。',
          '30/15 × 10：阶段更短、轮数更多。',
          '45/15 × 8：工作阶段更长、恢复更紧凑。',
        ],
      },
      {
        heading: 'HIIT 提醒、预警与全屏反馈',
        paragraphs: [
          'HIIT 计时器默认在阶段结束前 10 秒发出预警，并在切换时播放三次提示音。也可以换成单次短音、长音、交替提示、铃声、钟琴或柔和提示音。设备静音时，阶段名称和倒计时背景进度仍会持续变化。',
          '全屏适合健身房电视、训练室大屏和课堂投影。当前阶段与大字时间保持视觉中心，上一阶段、启动或暂停、跳过和复位等必要控制仍然可用，同时隐藏页面下方的说明文字。',
        ],
        bullets: [
          '阶段结束前提供 10 秒预警。',
          '可按环境选择响亮或柔和的提醒音。',
          '声音关闭时仍能依靠阶段文字和进度完成训练。',
        ],
      },
      {
        heading: '如何使用在线 HIIT 计时器',
        paragraphs: [
          '选择三个 HIIT 预设之一，或在设置中调整高强度、恢复、轮数、热身和冷身。点击中间大字或“启动”开始训练，然后按照“高强度”和“恢复”标签切换活动。下方阶段时间轴会提前显示完整顺序。',
          '需要讲解时可以暂停，动作提前结束时可以跳到下一阶段，也能返回上一阶段重新执行。点击时间轴中可用的阶段即可直接跳转。最后一个恢复或冷身结束后，页面会显示明确的完成状态，而不会自动开始新一轮。',
        ],
        bullets: [
          '开始前确认训练比例、轮数和提醒方式。',
          '直接点击大字倒计时快速暂停或继续。',
          '通过轮次与总剩余时间掌握完整训练进度。',
        ],
      },
      {
        heading: 'HIIT 计时与训练安全',
        paragraphs: [
          '本页面只提供计时、阶段提醒和显示功能，不会判断某个动作、强度或恢复时间是否适合个人情况。高强度活动应根据参与者和动作进行调整，开始前应做好准备，在动作无法安全控制或身体不适时停止。',
          'HIIT 并不只有一种固定比例。需要完全自定义的课堂轮换或工作/休息标签时，可以使用通用间歇计时器；需要经典 20 秒训练、10 秒休息、重复 8 轮时，可以打开 Tabata 计时器。',
        ],
      },
    ],
    faqs: [
      { q: 'HIIT 初次使用什么间隔？', a: '可以从 40 秒高强度、20 秒恢复、8 轮开始，再按训练能力调整。' },
      { q: '阶段切换前会预警吗？', a: '会。默认提前 10 秒提示，并在阶段切换时播放三次提示音。' },
      { q: '可以增加热身和冷身吗？', a: '可以，设置后会纳入同一个完整训练流程。' },
      { q: '这是医疗或训练建议吗？', a: '不是。本页面只提供计时功能，请根据自身情况选择训练强度。' },
      { q: '可以修改 40/20 HIIT 计时比例吗？', a: '可以。高强度、恢复和轮数都能修改，同时保留原始 40/20 快捷预设。' },
      { q: '使用 HIIT 计时器需要下载 App 吗？', a: '不需要。桌面、平板和手机的现代浏览器都能直接运行，也无需账号。' },
    ],
    sourcesTitle: 'HIIT 参考资料',
    sources: [
      { label: '美国运动医学会：高强度间歇训练说明', href: 'https://www.acsm.org/docs/default-source/files-for-resource-library/high-intensity-interval-training.pdf' },
    ],
    relatedTitle: '更多间歇计时模式', relatedIntro: '可以切换经典 Tabata，或使用通用间歇计时器自由设置。',
  },
  tabata: {
    metadata: { title: 'Tabata 计时器：20 秒/10 秒 × 8 轮（4 分钟）', description: '免费在线 Tabata 计时器，提供经典 20/10 × 8 和 40/20 选项，支持声音提醒、轮次进度与全屏，无需 App 或账号。' },
    heading: '免费在线 Tabata 计时器：20/10 × 8', faqTitle: 'Tabata 计时器常见问题',
    intro: '直接启动经典四分钟结构：20 秒训练、10 秒休息，共 8 轮。免费在线 Tabata 计时器会持续显示当前阶段、大字倒计时和轮次，无需 App 或账号。',
    blocks: [
      {
        heading: '经典 20/10 Tabata 节奏',
        paragraphs: [
          '经典 Tabata 结构由 20 秒训练和 10 秒休息交替组成，共重复 8 轮。每一组训练与休息合计 30 秒，因此完整流程正好是 4 分钟。计时器会预先生成全部 16 个阶段，并在运行中自动切换，同时显示当前轮次和总剩余时间。',
          '20/10 节奏来自特定的高强度间歇训练研究。现在许多活动会更宽泛地使用 Tabata 名称，但本页面始终把 20 秒训练、10 秒休息、8 轮保留为默认的经典预设。',
        ],
        bullets: [
          '20 秒训练后自动进入 10 秒休息。',
          '8 个完整轮次，共 16 次训练与休息阶段。',
          '包含每次休息时，经典流程总长 4 分钟。',
        ],
      },
      {
        heading: '选择经典 Tabata 或爆汗 Tabata',
        paragraphs: [
          '经典预设为 20/10 × 8。虽然用户可能会搜索“40/20 Tabata 计时器”，但这个较长比例更准确地属于 HIIT：爆汗 Tabata 预设采用 40 秒训练、20 秒休息、共 8 轮；入门预设为 20/20 × 6；延长预设保持 20/10 比例并增加到 12 轮。',
          '40/20、入门和延长模式都是方便使用的计时变体，并不表示它们复制了原始研究方案。预设可作为起点，工作、休息、轮数、热身和冷身仍然能够在设置中修改。',
        ],
        bullets: [
          '经典：20/10 × 8，完整流程 4 分钟。',
          '爆汗 Tabata：40 秒训练、20 秒休息、8 轮。',
          '入门：20/20 × 6，训练和恢复时间相同。',
          '延长：20/10 × 12，完整流程 6 分钟。',
        ],
      },
      {
        heading: 'Tabata 计时器提醒与视觉反馈',
        paragraphs: [
          '默认使用三次提示音标记训练和休息切换，也可以选择提前 10 秒预警、单次短音、长音、交替提示、铃声、钟琴或柔和音。开始前先在设置中试听，确保音量和音色适合当前空间。',
          '阶段名称、大字倒计时、轮次和背景进度会同步提供视觉提示。即使设备静音，所有参与者仍能从共享屏幕判断当前处于训练还是休息阶段。',
        ],
        bullets: [
          '每次训练与休息转换都有声音提示。',
          '可选择阶段结束前的预警方式。',
          '适合健身房、课堂和家庭屏幕的全屏显示。',
        ],
      },
      {
        heading: '如何使用在线 Tabata 计时器',
        paragraphs: [
          '打开页面后点击中间大字或“启动”，即可直接运行经典四分钟预设。按照“训练”和“休息”标签完成 8 轮。主计时器下方的时间轴会按顺序显示全部阶段，已完成阶段自动置灰，也可以点击可用阶段进行跳转。',
          '讲解或意外中断时可以暂停，需要重做时返回上一阶段，提前结束动作时跳过当前阶段，复位则回到完整流程起点。全屏会隐藏下方说明，只保留大字时间、进度和必要控制。',
        ],
        bullets: [
          '一次点击启动经典 4 分钟 Tabata 计时器。',
          '无需重新设置即可暂停、继续、重复或跳过阶段。',
          '在主屏幕查看轮次进度和总剩余时间。',
        ],
      },
      {
        heading: 'Tabata、HIIT 与自定义间歇的区别',
        paragraphs: [
          'Tabata 是一种明确的高强度间歇结构，而 HIIT 可以采用许多不同的工作与恢复比例。需要原始计时节奏时选择经典 20/10 × 8，需要更长的 40/20 阶段时可以选择爆汗 Tabata。HIIT 计时器提供训练专用标签，通用间歇计时器则适合课堂轮换和完全自定义的工作/休息循环。',
          '页面只负责计时，不规定动作或强度。活动应根据参与者情况调整，并配合适当热身；涉及健康、受伤或训练安排问题时，应寻求合格专业人员的建议。',
        ],
      },
    ],
    faqs: [
      { q: '经典 Tabata 是什么节奏？', a: '20 秒训练、10 秒休息，重复 8 轮。' },
      { q: '20/10 × 8 一共多久？', a: '每轮都包含训练和休息时，总时长为 4 分钟。' },
      { q: '可以修改 Tabata 轮数吗？', a: '可以。经典预设始终保留，设置中可以修改工作、休息和轮数。' },
      { q: '可以使用 40/20 Tabata 计时器吗？', a: '可以。选择“爆汗 Tabata”即可使用 40 秒训练、20 秒休息、8 轮；它属于 HIIT 变化，经典 Tabata 仍然是 20/10 × 8。' },
      { q: '适合健身房或课堂大屏吗？', a: '适合。全屏会保留阶段、时间、进度和必要控制，方便远距离查看。' },
      { q: '所有 20/10 训练都是经典 Tabata 吗？', a: '计时结构相同，但原始方案还包含特定运动强度。本页面提供时间结构，不提供训练处方。' },
      { q: '需要下载 Tabata 计时器吗？', a: '不需要。桌面、平板或手机浏览器可以直接运行，无需注册账号。' },
    ],
    sourcesTitle: 'Tabata 参考资料',
    sources: [
      { label: 'Tabata 等（1996）：中等强度耐力训练与高强度间歇训练研究', href: 'https://pubmed.ncbi.nlm.nih.gov/8897392/' },
    ],
    relatedTitle: '更多工作与休息计时器', relatedIntro: '可以使用通用间歇计时器，或切换更长的 HIIT 高强度与恢复预设。',
  },
}

const zhHant: Record<IntervalVariant, Omit<PageData, 'path'>> = {
  interval: {
    metadata: { title: '線上間歇計時器：自訂工作、休息與輪次', description: '免費線上間歇計時器，提供 40/20 快捷預設，可設定工作、休息、1–99 輪、熱身、冷身、聲音提醒與全螢幕，無需 App 或帳號。' },
    heading: '免費線上間歇計時器', faqTitle: '線上間歇計時器常見問題',
    intro: '使用免費線上間歇計時器，快速建立重複的工作與休息循環。大字倒數適用於手機、課堂大螢幕與訓練場地，直接點擊中央時間即可啟動或暫停，無需安裝 App。',
    blocks: [
      {
        heading: '自訂工作、休息與輪次',
        paragraphs: [
          '間歇計時器與一般單次倒數不同，它會依照預先設定的順序自動切換工作與休息階段。只要設定每次工作的時間、階段之間的休息或轉場時間，以及需要重複的輪數，啟動後便不必在每個階段結束時手動重新計時。',
          '這種循環適合訓練、課堂輪換、分組討論、簡報練習、專注學習與需要統一節奏的會議活動。設定支援 1–99 輪，也能在正式循環前後加入熱身與冷身，讓完整流程由同一個線上間歇計時器連續執行。',
        ],
        bullets: [
          '工作與休息時間可按秒設定，短間隔與長活動都能精準控制。',
          '設定 1–99 輪，並在啟動前查看完整階段順序。',
          '可選擇熱身、冷身，以及從休息階段開始。',
        ],
      },
      {
        heading: '選擇 40/20 或其他間歇計時預設',
        paragraphs: [
          '頁面提供四個常見起點。工作 / 休息預設為工作 60 秒、休息 30 秒、共 5 輪；40/20 間歇計時預設為工作 40 秒、休息 20 秒、共 8 輪；課堂輪換為活動 10 分鐘、轉場 2 分鐘、共 4 輪；循環訓練為工作與休息各 30 秒、共 10 輪。',
          '預設只是快速開始的範本，不會限制後續修改。選擇預設後仍可在設定中調整時間、輪數、階段順序與提醒方式。最近一次設定會儲存在目前瀏覽器中，不需要註冊帳號，也不會上傳計時器名稱。',
        ],
        bullets: [
          '工作 / 休息：60 秒工作、30 秒休息、5 輪。',
          '40/20 工作休息：40 秒工作、20 秒休息、8 輪。',
          '課堂輪換：10 分鐘活動、2 分鐘轉場、4 輪。',
          '循環訓練：30 秒工作、30 秒休息、10 輪。',
        ],
      },
      {
        heading: '聲音提醒與全螢幕進度',
        paragraphs: [
          '聲音提醒能讓參與者專注於目前任務，不必持續盯著秒數。可選擇三次提示音、提前 10 秒預警、單次短音、單次長音、交替提示、鈴聲、鐘琴或柔和提示音。目前階段、輪次、剩餘時間與總進度也會提供視覺回饋，因此裝置靜音時仍可正常使用。',
          '進入全螢幕後，頁面內文與導覽會被隱藏，只保留目前階段、大字倒數、階段時間軸與必要控制。投影至課堂、訓練場地或會議大螢幕時，遠處的參與者也能看清目前是工作、休息或轉場。',
        ],
        bullets: [
          '開始前可在設定中試聽提醒音。',
          '靜音狀態下仍有階段名稱、色彩與進度變化。',
          '全螢幕模式減少干擾，並保留暫停、跳過與重設控制。',
        ],
      },
      {
        heading: '如何使用線上間歇計時器',
        paragraphs: [
          '先選擇快捷預設，或開啟設定輸入工作秒數、休息秒數與循環輪數。點擊中央的大字時間或「啟動」按鈕即可開始。執行中可以暫停、返回上一階段、跳過目前階段，或重設至整個流程的起點。',
          '下方時間軸會依序列出所有工作與休息階段。已完成內容會變成灰色，可用階段能夠點擊跳轉。已用時間、目前輪次與總剩餘時間會持續顯示於主計時區域，查看完整進度時無需再次開啟設定。',
        ],
        bullets: [
          '啟動前選擇預設或自訂完整循環。',
          '直接點擊大字倒數即可啟動、暫停或繼續。',
          '透過階段時間軸查看順序並跳至指定間隔。',
        ],
      },
      {
        heading: '線上間歇計時器適合哪些情境',
        paragraphs: [
          '教師可以把重複階段用於學習站輪換、同儕交流、限時討論與活動收尾；教練或個人使用者可以安排循環訓練、伸展與恢復；專注工作、排練與會議環節也能藉由統一的大螢幕節奏減少反覆提醒。',
          '需要中性的「工作 / 休息」標籤時，可以直接選擇內建 40/20 間歇計時預設；需要專用的「高強度 / 恢復」標籤時，可以開啟 HIIT 計時器；如果要使用經典 20 秒訓練、10 秒休息、8 輪的四分鐘結構，可以開啟 Tabata 計時器。',
        ],
      },
    ],
    faqs: [
      { q: '這款間歇計時器免費嗎？', a: '免費。直接在瀏覽器執行，無需帳號或下載。' },
      { q: '可以自訂工作、休息與輪數嗎？', a: '可以。每個階段按秒設定，支援 1–99 輪，也能加入熱身與冷身。' },
      { q: '支援全螢幕嗎？', a: '支援。全螢幕只保留階段、大字時間、進度與必要控制。' },
      { q: '可以用於課堂輪換嗎？', a: '可以。課堂輪換預設為 10 分鐘工作、2 分鐘轉場，並可繼續修改。' },
      { q: '可以直接使用 40/20 間歇計時嗎？', a: '可以。選擇「40 / 20 工作休息」即可使用 40 秒工作、20 秒休息、8 輪的設定，也能繼續修改。' },
      { q: '線上間歇計時器會儲存我的設定嗎？', a: '會。最近一次設定只會儲存在目前瀏覽器中，無需帳號，也不會上傳計時器名稱。' },
      { q: '間歇計時器與一般倒數有什麼差別？', a: '一般倒數只執行一次；間歇計時器會依設定輪數自動交替工作與休息階段。' },
    ],
    relatedTitle: '間歇計時預設', relatedIntro: '通用頁面適合自由設定，也可以直接開啟 HIIT 或 Tabata 專用計時器。',
  },
  hiit: {
    metadata: { title: 'HIIT 計時器：40/20、30/15 線上訓練間歇', description: '免費線上 HIIT 計時器，提供 40/20、30/15、45/15 預設、輪次進度、10 秒預警與全螢幕。無需 App 或帳號，立即開始訓練。' },
    heading: '免費線上 HIIT 計時器', faqTitle: 'HIIT 計時器常見問題',
    intro: '無需安裝 App，直接使用免費線上 HIIT 計時器進行高強度與恢復循環。預設 40 秒高強度、20 秒恢復、8 輪，也能一鍵切換其他訓練比例。',
    blocks: [
      {
        heading: 'HIIT 計時器如何運作',
        paragraphs: [
          '高強度間歇訓練會在較高強度活動與恢復階段之間重複切換。HIIT 計時器會自動處理階段變化、提醒與輪數統計，使用者不必一直查看碼表，也不用在每次恢復結束時重新設定下一輪。',
          '這個專用頁面會將兩個階段清楚顯示為「高強度」與「恢復」。大字倒數、目前輪數、已用時間與總剩餘時間同步顯示，讓個人、教練或整組參與者快速了解訓練進度。',
        ],
        bullets: [
          '自動切換高強度與恢復階段。',
          '同步顯示目前輪次、總進度與剩餘時間。',
          '可將熱身與冷身加入同一個訓練流程。',
        ],
      },
      {
        heading: '選擇 40/20、30/15 或 45/15 HIIT 預設',
        paragraphs: [
          '預設 40/20 為 40 秒高強度、20 秒恢復，共 8 輪；快速 HIIT 為 30 秒高強度、15 秒恢復，共 10 輪；力量間歇為 45 秒高強度、15 秒恢復，共 8 輪。這些數值是方便啟動的計時範本，並非固定訓練處方。',
          '選擇比例時應考量動作類型、場地、參與者經驗與恢復需求。快速動作可能較適合短工作階段，需要講解或技術控制時則可以增加恢復時間。所有工作、恢復與輪數都能在設定中修改。',
        ],
        bullets: [
          '40/20 × 8：預設的均衡 HIIT 計時組合。',
          '30/15 × 10：階段較短、輪數更多。',
          '45/15 × 8：工作階段較長、恢復較緊湊。',
        ],
      },
      {
        heading: 'HIIT 提醒、預警與全螢幕回饋',
        paragraphs: [
          'HIIT 計時器預設在階段結束前 10 秒發出預警，並在切換時播放三次提示音。也可以改用單次短音、長音、交替提示、鈴聲、鐘琴或柔和提示音。裝置靜音時，階段名稱與倒數背景進度仍會持續變化。',
          '全螢幕適合健身房電視、訓練室大螢幕與課堂投影。目前階段與大字時間保持視覺中心，上一階段、啟動或暫停、跳過與重設等必要控制仍可使用，同時隱藏頁面下方的說明文字。',
        ],
        bullets: [
          '階段結束前提供 10 秒預警。',
          '可依環境選擇響亮或柔和的提醒音。',
          '關閉聲音時仍能依靠階段文字與進度完成訓練。',
        ],
      },
      {
        heading: '如何使用線上 HIIT 計時器',
        paragraphs: [
          '選擇三個 HIIT 預設之一，或在設定中調整高強度、恢復、輪數、熱身與冷身。點擊中央大字或「啟動」開始訓練，接著依照「高強度」與「恢復」標籤切換活動。下方階段時間軸會預先顯示完整順序。',
          '需要講解時可以暫停，動作提早結束時可以跳至下一階段，也能返回上一階段重新執行。點擊時間軸中的可用階段即可直接跳轉。最後一個恢復或冷身結束後，頁面會顯示清楚的完成狀態，不會自動開始新一輪。',
        ],
        bullets: [
          '開始前確認訓練比例、輪數與提醒方式。',
          '直接點擊大字倒數快速暫停或繼續。',
          '透過輪次與總剩餘時間掌握完整訓練進度。',
        ],
      },
      {
        heading: 'HIIT 計時與訓練安全',
        paragraphs: [
          '本頁面只提供計時、階段提醒與顯示功能，不會判斷某個動作、強度或恢復時間是否適合個人狀況。高強度活動應依參與者與動作調整，開始前應做好準備，在動作無法安全控制或身體不適時停止。',
          'HIIT 並不只有一種固定比例。需要完全自訂的課堂輪換或工作/休息標籤時，可以使用通用間歇計時器；需要經典 20 秒訓練、10 秒休息、重複 8 輪時，可以開啟 Tabata 計時器。',
        ],
      },
    ],
    faqs: [
      { q: '初次使用 HIIT 可以選擇什麼間隔？', a: '可以從 40 秒高強度、20 秒恢復、8 輪開始，再依訓練能力調整。' },
      { q: '階段切換前會預警嗎？', a: '會。預設提前 10 秒提示，並在階段切換時播放三次提示音。' },
      { q: '可以增加熱身與冷身嗎？', a: '可以，設定後會納入同一個完整訓練流程。' },
      { q: '這是醫療或訓練建議嗎？', a: '不是。本頁面只提供計時功能，請依自身狀況選擇訓練強度。' },
      { q: '可以修改 40/20 HIIT 計時比例嗎？', a: '可以。高強度、恢復與輪數都能修改，同時保留原始 40/20 快捷預設。' },
      { q: '使用 HIIT 計時器需要下載 App 嗎？', a: '不需要。桌面、平板與手機的現代瀏覽器都能直接執行，也無需帳號。' },
    ],
    sourcesTitle: 'HIIT 參考資料',
    sources: [
      { label: '美國運動醫學會：高強度間歇訓練說明', href: 'https://www.acsm.org/docs/default-source/files-for-resource-library/high-intensity-interval-training.pdf' },
    ],
    relatedTitle: '更多間歇計時模式', relatedIntro: '可以切換經典 Tabata，或使用通用間歇計時器自由設定。',
  },
  tabata: {
    metadata: { title: 'Tabata 計時器：20 秒/10 秒 × 8 輪（4 分鐘）', description: '免費線上 Tabata 計時器，提供經典 20/10 × 8 與 40/20 選項，支援聲音提醒、輪次進度及全螢幕，無需 App 或帳號。' },
    heading: '免費線上 Tabata 計時器：20/10 × 8', faqTitle: 'Tabata 計時器常見問題',
    intro: '直接啟動經典四分鐘結構：20 秒訓練、10 秒休息，共 8 輪。免費線上 Tabata 計時器會持續顯示目前階段、大字倒數與輪次，無需 App 或帳號。',
    blocks: [
      {
        heading: '經典 20/10 Tabata 節奏',
        paragraphs: [
          '經典 Tabata 結構由 20 秒訓練與 10 秒休息交替組成，共重複 8 輪。每一組訓練與休息合計 30 秒，因此完整流程正好是 4 分鐘。計時器會預先建立全部 16 個階段，並在執行中自動切換，同時顯示目前輪次與總剩餘時間。',
          '20/10 節奏源自特定的高強度間歇訓練研究。現在許多活動會較廣泛地使用 Tabata 名稱，但本頁面始終將 20 秒訓練、10 秒休息、8 輪保留為預設的經典組合。',
        ],
        bullets: [
          '20 秒訓練後自動進入 10 秒休息。',
          '8 個完整輪次，共 16 次訓練與休息階段。',
          '包含每次休息時，經典流程總長 4 分鐘。',
        ],
      },
      {
        heading: '選擇經典 Tabata 或爆汗 Tabata',
        paragraphs: [
          '經典預設為 20/10 × 8。雖然使用者可能會搜尋「40/20 Tabata 計時器」，但這個較長比例更準確地屬於 HIIT：爆汗 Tabata 預設採用 40 秒訓練、20 秒休息、共 8 輪；入門預設為 20/20 × 6；延長預設保持 20/10 比例並增加至 12 輪。',
          '40/20、入門與延長模式都是方便使用的計時變化，並不表示它們複製了原始研究方案。預設可作為起點，工作、休息、輪數、熱身與冷身仍能在設定中修改。',
        ],
        bullets: [
          '經典：20/10 × 8，完整流程 4 分鐘。',
          '爆汗 Tabata：40 秒訓練、20 秒休息、8 輪。',
          '入門：20/20 × 6，訓練與恢復時間相同。',
          '延長：20/10 × 12，完整流程 6 分鐘。',
        ],
      },
      {
        heading: 'Tabata 計時器提醒與視覺回饋',
        paragraphs: [
          '預設使用三次提示音標示訓練與休息切換，也可以選擇提前 10 秒預警、單次短音、長音、交替提示、鈴聲、鐘琴或柔和音。開始前先在設定中試聽，確保音量與音色適合目前空間。',
          '階段名稱、大字倒數、輪次與背景進度會同步提供視覺提示。即使裝置靜音，所有參與者仍能從共享螢幕判斷目前處於訓練或休息階段。',
        ],
        bullets: [
          '每次訓練與休息轉換都有聲音提示。',
          '可選擇階段結束前的預警方式。',
          '適合健身房、課堂與家庭螢幕的全螢幕顯示。',
        ],
      },
      {
        heading: '如何使用線上 Tabata 計時器',
        paragraphs: [
          '開啟頁面後點擊中央大字或「啟動」，即可直接執行經典四分鐘預設。依照「訓練」與「休息」標籤完成 8 輪。主計時器下方的時間軸會依序顯示全部階段，已完成階段自動變成灰色，也可以點擊可用階段進行跳轉。',
          '講解或意外中斷時可以暫停，需要重做時返回上一階段，提早結束動作時跳過目前階段，重設則回到完整流程起點。全螢幕會隱藏下方說明，只保留大字時間、進度與必要控制。',
        ],
        bullets: [
          '一次點擊啟動經典 4 分鐘 Tabata 計時器。',
          '無需重新設定即可暫停、繼續、重複或跳過階段。',
          '在主螢幕查看輪次進度與總剩餘時間。',
        ],
      },
      {
        heading: 'Tabata、HIIT 與自訂間歇的差別',
        paragraphs: [
          'Tabata 是一種明確的高強度間歇結構，而 HIIT 可以採用許多不同的工作與恢復比例。需要原始計時節奏時選擇經典 20/10 × 8，需要較長的 40/20 階段時可以選擇爆汗 Tabata。HIIT 計時器提供訓練專用標籤，通用間歇計時器則適合課堂輪換與完全自訂的工作/休息循環。',
          '頁面只負責計時，不規定動作或強度。活動應依參與者狀況調整，並搭配適當熱身；涉及健康、受傷或訓練安排問題時，應尋求合格專業人員的建議。',
        ],
      },
    ],
    faqs: [
      { q: '經典 Tabata 是什麼節奏？', a: '20 秒訓練、10 秒休息，重複 8 輪。' },
      { q: '20/10 × 8 一共多久？', a: '每輪都包含訓練與休息時，總時間為 4 分鐘。' },
      { q: '可以修改 Tabata 輪數嗎？', a: '可以。經典預設會一直保留，設定中可以修改工作、休息與輪數。' },
      { q: '可以使用 40/20 Tabata 計時器嗎？', a: '可以。選擇「爆汗 Tabata」即可使用 40 秒訓練、20 秒休息、8 輪；它屬於 HIIT 變化，經典 Tabata 仍然是 20/10 × 8。' },
      { q: '適合健身房或課堂大螢幕嗎？', a: '適合。全螢幕會保留階段、時間、進度與必要控制，方便遠距離查看。' },
      { q: '所有 20/10 訓練都是經典 Tabata 嗎？', a: '計時結構相同，但原始方案還包含特定運動強度。本頁面提供時間結構，不提供訓練處方。' },
      { q: '需要下載 Tabata 計時器嗎？', a: '不需要。桌面、平板或手機瀏覽器可以直接執行，無需註冊帳號。' },
    ],
    sourcesTitle: 'Tabata 參考資料',
    sources: [
      { label: 'Tabata 等人（1996）：中等強度耐力訓練與高強度間歇訓練研究', href: 'https://pubmed.ncbi.nlm.nih.gov/8897392/' },
    ],
    relatedTitle: '更多工作與休息計時器', relatedIntro: '可以使用通用間歇計時器，或切換較長的 HIIT 高強度與恢復預設。',
  },
}

const localized = { en, zh, 'zh-hant': zhHant }

export function getIntervalPageData(locale: Locale, variant: IntervalVariant): PageData {
  return { path: paths[variant], ...localized[locale][variant] }
}

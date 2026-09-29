import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { siteConfig } from '@/config/site'
import type { Locale } from '@/config/i18n'
import { PresentationProgress } from './presentation-progress'
import { agendaSegments } from '../lib/readout'
import styles from './presentation-views-showcase.module.css'

const sampleDurationSec = 600
const sampleRemainingMs = 272_000
const sampleRatio = sampleRemainingMs / (sampleDurationSec * 1000)
const sampleSegments = agendaSegments({
  id: 'showcase',
  title: '',
  durationSec: sampleDurationSec,
})

export async function PresentationViewsShowcase({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'presentationTimer.page.showcase' })
  const ui = await getTranslations({ locale, namespace: 'presentationTimer' })
  const currentTitle = ui('agendaNames.studentPresentation')
  const previousTitle = ui('agendaNames.opening')
  const nextTitle = ui('agendaNames.questions')
  const hostName = siteConfig.url.replace(/^https?:\/\//, '')
  const phaseLabels = {
    green: ui('phases.green'),
    yellow: ui('phases.yellow'),
    red: ui('phases.red'),
  }
  const nextLine = `${nextTitle} · ${t('sampleNextTime')}`

  return (
    <section className={styles.root} aria-labelledby="presentation-views-heading">
      <div className={`container ${styles.inner}`}>
        <h2 id="presentation-views-heading" className={styles.heading}>
          {t('heading')}
        </h2>
        <p className={styles.intro}>{t('intro')}</p>
        <div className={styles.grid}>
          <figure className={styles.figure}>
            <div className={styles.host} aria-hidden="true">
              <div className={styles.hostChrome}>
                <span className={styles.hostRoom}>{ui('landing.defaultRoomName')}</span>
                <span className={styles.live}>{ui('room.connected', { count: 3 })}</span>
              </div>
              <div className={styles.hostPanel}>
                <div className={styles.hostRow}>
                  <div>
                    <p className={styles.kicker}>{ui('room.current')}</p>
                    <p className={styles.hostCurrent}>{currentTitle}</p>
                  </div>
                  <div className={styles.hostNext}>
                    <p className={styles.kicker}>{ui('room.next')}</p>
                    <p className={styles.hostNextName}>{nextLine}</p>
                  </div>
                </div>
                <p className={styles.hostTime}>{t('sampleTime')}</p>
                <PresentationProgress
                  ratio={sampleRatio}
                  phase="green"
                  compact
                  showLabels={false}
                  segments={sampleSegments}
                  labels={phaseLabels}
                />
              </div>
              <div className={styles.hostControls}>
                <span className={styles.chip}>{ui('controls.minusMinute')}</span>
                <span className={styles.chip}>{ui('controls.reset')}</span>
                <span className={`${styles.chip} ${styles.chipPause}`}>{ui('controls.pause')}</span>
                <span className={styles.chip}>{ui('controls.plusMinute')}</span>
                <span className={styles.chip}>{ui('controls.next')}</span>
              </div>
            </div>
            <figcaption className={styles.caption}>
              <span className={styles.label}>{t('host.label')}</span>
              {t('host.caption')}
            </figcaption>
          </figure>

          <figure className={styles.figure}>
            <div className={styles.operator} aria-hidden="true">
              <div className={styles.operatorChrome}>
                <span className={styles.badge}>{ui('operator.badge')}</span>
                <span className={styles.operatorMeta}>
                  {ui('operator.position', { current: 2, count: 4 })}
                </span>
              </div>
              <div className={styles.steps}>
                <span className={styles.step}>
                  <span className={styles.stepLabel}>{ui('controls.previous')}</span>
                  <span className={styles.stepTitle}>{previousTitle}</span>
                </span>
                <span className={styles.step}>
                  <span className={styles.stepLabel}>{ui('controls.next')}</span>
                  <span className={styles.stepTitle}>{nextTitle}</span>
                </span>
              </div>
              <p className={styles.operatorTitle}>{currentTitle}</p>
              <p className={styles.operatorTime}>{t('sampleTime')}</p>
              <PresentationProgress
                ratio={sampleRatio}
                phase="green"
                compact
                showLabels={false}
                segments={sampleSegments}
                labels={phaseLabels}
              />
              <div className={styles.operatorActions}>
                <span className={styles.pause}>{ui('controls.pause')}</span>
                <span className={styles.reset}>{ui('controls.reset')}</span>
              </div>
            </div>
            <figcaption className={styles.caption}>
              <span className={styles.label}>{t('operator.label')}</span>
              {t('operator.caption')}
            </figcaption>
          </figure>

          <figure className={styles.figure}>
            <div className={styles.display} aria-hidden="true">
              <div className={styles.displayBrand}>
                <Image src="/mark.svg" alt="" width={14} height={14} />
                <span>{hostName}</span>
              </div>
              <p className={styles.displayTitle}>{currentTitle}</p>
              <p className={styles.displayTime}>{t('sampleTime')}</p>
              <p className={styles.displayNext}>
                {ui('room.next')}: {nextLine}
              </p>
              <div className={styles.displayBar}>
                <span className={styles.displayBarYellow} />
                <span className={styles.displayBarGreen} />
                <span className={styles.displayBarElapsed} />
              </div>
            </div>
            <figcaption className={styles.caption}>
              <span className={styles.label}>{t('display.label')}</span>
              {t('display.caption')}
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  )
}

import type { ThemePreference } from '../hooks/useTheme'
import { Icon } from './Icon'
import styles from './ThemeSwitch.module.css'

const OPTIONS = [
  { value: 'system', label: 'Match system theme', icon: 'monitor' },
  { value: 'light', label: 'Light theme', icon: 'sun' },
  { value: 'dark', label: 'Dark theme', icon: 'moon' },
] as const

interface ThemeSwitchProps {
  value: ThemePreference
  onChange: (value: ThemePreference) => void
}

export function ThemeSwitch({ value, onChange }: ThemeSwitchProps) {
  return (
    <fieldset className={styles.switch}>
      <legend className="visually-hidden">Theme</legend>
      {OPTIONS.map((opt) => (
        <label key={opt.value} className={styles.option} title={opt.label}>
          <input
            type="radio"
            name="theme"
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            aria-label={opt.label}
          />
          <span className={styles.face}>
            <Icon name={opt.icon} size={15} />
          </span>
        </label>
      ))}
    </fieldset>
  )
}

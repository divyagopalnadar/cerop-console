import { useId } from 'react'
import styles from './Segmented.module.css'

interface SegmentedProps<T extends string> {
  label: string
  options: readonly { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  hideLabel?: boolean
}

/** A radio group styled as a segmented control; arrow keys work natively. */
export function Segmented<T extends string>({ label, options, value, onChange, hideLabel }: SegmentedProps<T>) {
  const name = useId()
  return (
    <fieldset className={styles.group}>
      <legend className={hideLabel ? 'visually-hidden' : styles.legend}>{label}</legend>
      <div className={styles.track}>
        {options.map((opt) => (
          <label key={opt.value} className={styles.option}>
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
            />
            <span>{opt.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

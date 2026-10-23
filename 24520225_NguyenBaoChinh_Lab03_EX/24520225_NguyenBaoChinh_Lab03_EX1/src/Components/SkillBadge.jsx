import styles from './DeveloperCard.module.css';

export function SkillBadge({ name = 'React 19', level = 'Core' }) {
    return (
        <span className={styles.skillBadge}>
            <span>{name}</span>
            <span className={styles.skillLevel}>{level}</span>
        </span>
    );
}

import { Fragment } from 'react';
import styles from './DeveloperCard.module.css';

export function DeveloperCard({
    fullName = 'Tran Vinh Khiem',
    role = 'Senior Systems Architect • UIT S3T',
    avatarUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=240',
    metrics = { commits: 512, vdomNodes: 0, a11yScore: 100 },
    skills = [{ id: 'sk-1', name: 'React 19 Fiber', tier: 'Core' }],
}) {
    return (
        <article className={styles.card} aria-labelledby='dev-heading'>
            <header className={styles.header}>
                <img src={avatarUrl} alt={fullName} width='64' height='64' />
                <hgroup><h2 id='dev-heading'>{fullName}</h2><p>{role}</p></hgroup>
            </header>
            <dl className={styles.metrics}>
                {Object.entries(metrics).map(([k, v]) => (
                    <Fragment key={k}><dt>{k}</dt><dd>{v}</dd></Fragment>
                ))}
            </dl>
            <ul className={styles.skills} aria-label='Engineered Skills'>
                {skills.map((s) => <li key={s.id}>{s.name} ({s.tier})</li>)}
            </ul>
        </article>
    );
}


import { Fragment } from 'react';
import { SkillBadge } from './SkillBadge.jsx';
import styles from './DeveloperCard.module.css';

const DEFAULT_SKILLS = [
    { id: 'sk-1', name: 'React 19', tier: 'Core' },
    { id: 'sk-2', name: 'JavaScript', tier: 'Core' },
    { id: 'sk-3', name: 'CSS Modules', tier: 'Advanced' },
];

export function DeveloperCard({
    fullName = 'Nguyen Bao Chinh',
    role = 'Frontend Developer',
    avatarUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=240',
    metrics = {
        commits: 512,
        vdomNodes: 0,
        a11yScore: '100%',
    },
    skills = DEFAULT_SKILLS,
}) {
    return (
        <article
            className={styles.card}
            aria-labelledby="dev-heading"
        >
            <header className={styles.header}>
                <img
                    className={styles.avatar}
                    src={avatarUrl}
                    alt={`Avatar of ${fullName}`}
                    width="72"
                    height="72"
                />

                <hgroup>
                    <p className={styles.eyebrow}>DEVELOPER PROFILE</p>
                    <h2 id="dev-heading">{fullName}</h2>
                    <p className={styles.role}>{role}</p>
                </hgroup>
            </header>

            <section
                className={styles.section}
                aria-label="Developer metrics"
            >
                <h3>Engineering Metrics</h3>

                <dl className={styles.metrics}>
                    {Object.entries(metrics).map(([key, value]) => (
                        <Fragment key={key}>
                            <dt>{key}</dt>
                            <dd>{value}</dd>
                        </Fragment>
                    ))}
                </dl>
            </section>

            <section
                className={styles.section}
                aria-label="Technical skills"
            >
                <h3>Technical Skills</h3>

                <ul className={styles.skills}>
                    {skills.map((skill) => (
                        <li key={skill.id}>
                            <SkillBadge
                                name={skill.name}
                                tier={skill.tier}
                            />
                        </li>
                    ))}
                </ul>
            </section>

            <footer className={styles.footer}>
                Built with React 19
            </footer>
        </article>
    );
}

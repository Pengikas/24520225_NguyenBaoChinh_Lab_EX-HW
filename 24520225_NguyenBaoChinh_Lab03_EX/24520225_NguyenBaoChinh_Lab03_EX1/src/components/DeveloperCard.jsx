
import { Fragment, useState } from 'react';
import SkillBadge from './SkillBadge.jsx';
import styles from './DeveloperCard.module.css';

const DEFAULT_SKILLS = [
    { id: 'react', name: 'React 19', tier: 'Core' },
    { id: 'python', name: 'Python', tier: 'Advanced' },
    { id: 'sql', name: 'SQL', tier: 'Core' },
];

export default function DeveloperCard({
    fullName = 'Nguyen Bao Chinh',
    role = 'Senior Systems Architect • UIT S3T',
    avatarUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=240&h=240&fit=crop&crop=faces',
    metrics = {
        commits: 512,
        vdomNodes: 0,
        a11yScore: 100,
    },
    skills = DEFAULT_SKILLS,
}) {
    const [imageFailed, setImageFailed] = useState(false);

    const initials = fullName
        .trim()
        .split(/\s+/)
        .slice(-2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();

    return (
        <article
            className={styles.card}
            aria-labelledby="dev-heading"
        >
            <header className={styles.header}>
                {imageFailed ? (
                    <span
                        className={styles.avatarFallback}
                        role="img"
                        aria-label={`Avatar initials: ${initials}`}
                    >
                        {initials}
                    </span>
                ) : (
                    <img
                        className={styles.avatar}
                        src={avatarUrl}
                        alt={`Portrait of ${fullName}`}
                        width={64}
                        height={64}
                        onError={() => setImageFailed(true)}
                    />
                )}

                <hgroup className={styles.identity}>
                    <h2 id="dev-heading">{fullName}</h2>
                    <p>{role}</p>
                </hgroup>
            </header>


            <dl className={styles.metrics} aria-label="Developer metrics">
                {Object.entries(metrics).map(([key, value]) => (
                    <Fragment key={key}>
                        <dt>{key}</dt>
                        <dd>{value}</dd>
                    </Fragment>
                ))}
            </dl>


            <section className={styles.skillSection} aria-labelledby="skills-heading">
                <h3 id="skills-heading">Engineering Skills</h3>
                <ul className={styles.skills} aria-label="Engineering Skills">
                    {skills.map((skill) => (
                        <SkillBadge
                            key={skill.id}
                            name={skill.name}
                            tier={skill.tier}
                        />
                    ))}
                </ul>
            </section>
        </article>
    );
}

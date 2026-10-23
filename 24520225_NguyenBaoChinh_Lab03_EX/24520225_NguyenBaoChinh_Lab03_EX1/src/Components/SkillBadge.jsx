
export function SkillBadge({ name = 'React 19', tier = 'Core' }) {
    return (
        <span className={`skill-badge skill-badge--${tier.toLowerCase()}`}>
            <span>{name}</span>
            <span className="skill-badge__tier">{tier}</span>
        </span>
    );
}

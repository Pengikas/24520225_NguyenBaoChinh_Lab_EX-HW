
export default function SkillBadge({
    name = 'JavaScript',
    tier = 'Core',
}) {
    return (
        <li className="skill-badge">
            <span>{name}</span>
            <span className="skill-tier">{tier}</span>
        </li>
    );
}

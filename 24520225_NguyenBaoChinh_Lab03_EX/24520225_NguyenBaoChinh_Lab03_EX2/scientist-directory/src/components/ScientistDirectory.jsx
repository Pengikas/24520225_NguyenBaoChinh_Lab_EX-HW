
import { useId, useState } from "react";
import { SMART_PEOPLE } from "../data/smartPeople.js";

export function ScientistDirectory({ initialData = SMART_PEOPLE }) {
    const searchId = useId();
    const iqId = useId();
    const sortId = useId();

    const [people] = useState(() => [...initialData]);
    const [query, setQuery] = useState("");
    const [minIq, setMinIq] = useState(160);
    const [sortBy, setSortBy] = useState("iq-desc");

    const visiblePeople = people
        .filter((person) => {
            const matchesName = person.name
                .toLowerCase()
                .includes(query.trim().toLowerCase());

            return matchesName && person.iq >= minIq;
        })
        .toSorted((a, b) => {
            switch (sortBy) {
                case "iq-asc":
                    return a.iq - b.iq;
                case "age-asc":
                    return a.age - b.age;
                case "age-desc":
                    return b.age - a.age;
                default:
                    return b.iq - a.iq;
            }
        });

    return (
        <main className="directory">
            <h1>Scientist &amp; Pioneer Directory</h1>

            <div className="controls">
                <div>
                    <label htmlFor={searchId}>Search by name</label>
                    <input
                        id={searchId}
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Enter a name..."
                    />
                </div>

                <div>
                    <label htmlFor={iqId}>Minimum IQ</label>
                    <input
                        id={iqId}
                        type="number"
                        min="0"
                        value={minIq}
                        onChange={(event) => {
                            const value = event.target.valueAsNumber;
                            setMinIq(Number.isNaN(value) ? 0 : value);
                        }}
                    />
                </div>

                <div>
                    <label htmlFor={sortId}>Sort by</label>
                    <select
                        id={sortId}
                        value={sortBy}
                        onChange={(event) => setSortBy(event.target.value)}
                    >
                        <option value="iq-desc">IQ: high to low</option>
                        <option value="iq-asc">IQ: low to high</option>
                        <option value="age-asc">Age: young to old</option>
                        <option value="age-desc">Age: old to young</option>
                    </select>
                </div>
            </div>

            <p role="status" aria-live="polite">
                {visiblePeople.length} scientists found
            </p>

            <ul className="people-list">
                {visiblePeople.map((person) => (
                    <li key={person.id} className="person-card">
                        <h2>{person.name}</h2>
                        <dl>
                            <dt>Age</dt>
                            <dd>{person.age}</dd>
                            <dt>IQ</dt>
                            <dd>{person.iq}</dd>
                        </dl>
                    </li>
                ))}
            </ul>
        </main>
    );
}


import { useId, useState } from "react";
import { SMART_PEOPLE } from "../data/smartPeople.js";

export function ScientistDirectory({ initialData = SMART_PEOPLE }) {
    const searchId = useId();
    const iqId = useId();
    const sortId = useId();

    const [people, setPeople] = useState(() => [...initialData]);
    const [query, setQuery] = useState("");
    const [minIq, setMinIq] = useState(160);
    const [sortBy, setSortBy] = useState("iq-desc");

    // Delete a scientist by their unique ID.
    function handleDelete(id) {
        setPeople((currentPeople) =>
            currentPeople.filter((person) => person.id !== id)
        );
    }

    // Restore the original list and reset all controls.
    function handleReset() {
        setPeople([...initialData]);
        setQuery("");
        setMinIq(160);
        setSortBy("iq-desc");
    }

    // Derive filtered and sorted results during rendering.
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
                case "iq-desc":
                default:
                    return b.iq - a.iq;
            }
        });

    return (
        <main className="directory">
            <header className="directory-header">
                <h1>Scientist &amp; Pioneer Directory</h1>
                <p>Explore, filter, and organize scientist records.</p>
            </header>

            <section className="controls" aria-label="Directory controls">
                <div className="control-group">
                    <label htmlFor={searchId}>Search by name</label>
                    <input
                        id={searchId}
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Enter a name..."
                    />
                </div>

                <div className="control-group">
                    <label htmlFor={iqId}>Minimum IQ</label>
                    <input
                        id={iqId}
                        type="number"
                        min="0"
                        step="1"
                        value={minIq}
                        onChange={(event) => {
                            const value = event.target.valueAsNumber;
                            setMinIq(Number.isNaN(value) ? 0 : Math.max(0, value));
                        }}
                    />
                </div>

                <div className="control-group">
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

                <button type="button" onClick={handleReset}>
                    Reset directory
                </button>
            </section>

            <p className="results-count" role="status" aria-live="polite">
                {visiblePeople.length}{" "}
                {visiblePeople.length === 1 ? "scientist" : "scientists"} found
            </p>

            {visiblePeople.length === 0 ? (
                <p className="empty-state">
                    No scientists match your search. Try changing your filters.
                </p>
            ) : (
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

                            <button
                                type="button"
                                onClick={() => handleDelete(person.id)}
                                aria-label={`Delete ${person.name}`}
                            >
                                Delete
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </main>
    );
}

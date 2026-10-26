
import DeveloperCard from './components/DeveloperCard.jsx';

export default function App() {
    return (
        <main className="page">
            <header className="page-heading">
                <p className="eyebrow">SPRINT 1 · EXERCISE 1</p>
                <h1>Developer Profile</h1>
                <p>Semantic HTML, reusable React components, and responsive CSS.</p>
            </header>

            <DeveloperCard />
        </main>
    );
}

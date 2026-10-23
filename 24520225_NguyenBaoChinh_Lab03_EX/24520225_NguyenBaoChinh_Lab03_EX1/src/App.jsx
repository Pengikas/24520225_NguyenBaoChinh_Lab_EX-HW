
import { DeveloperCard } from './Components/DeveloperCard.jsx';

export default function App() {
  return (
    <main className="app">
      <header className="app__header">
        <h1>Developer Showcase</h1>
        <p>A semantic React 19 developer profile.</p>
      </header>

      <DeveloperCard />
    </main>
  );
}

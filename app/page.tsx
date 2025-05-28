import Game from '@/components/Game';

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-200 to-sky-300 p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Flappy Bird</h1>
        <Game width={800} height={600} />
      </div>
    </main>
  );
}
